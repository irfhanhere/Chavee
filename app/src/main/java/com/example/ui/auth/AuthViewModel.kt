package com.example.ui.auth

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.AppDatabase
import com.example.data.ChaveeRepository
import com.example.data.UserEntity
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed class AuthState {
    object Loading : AuthState()
    object Onboarding : AuthState()
    object Unauthenticated : AuthState()
    data class Authenticated(val userId: String) : AuthState()
    data class Error(val message: String) : AuthState()
}

class AuthViewModel(application: Application) : AndroidViewModel(application) {

    private val db = AppDatabase.getDatabase(application)
    val repository = ChaveeRepository(db)

    private var firebaseAuth: FirebaseAuth? = null

    init {
        try {
            val googleAppIdId = application.resources.getIdentifier("google_app_id", "string", application.packageName)
            if (googleAppIdId != 0) {
                // Firebase configurations are present
                if (FirebaseApp.getApps(application).isNotEmpty()) {
                    firebaseAuth = FirebaseAuth.getInstance()
                } else {
                    FirebaseApp.initializeApp(application)
                    firebaseAuth = FirebaseAuth.getInstance()
                }
                Log.i("AuthViewModel", "Firebase successfully initialized in this process.")
            } else {
                Log.i("AuthViewModel", "Firebase google-services.json not configured. Falling back to robust offline demo mode.")
            }
        } catch (e: Exception) {
            Log.w("AuthViewModel", "Firebase initialization deferred: ${e.message}. Using robust offline demo mode.")
        }
    }

    private val _authState = MutableStateFlow<AuthState>(AuthState.Loading)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    // Preferences-like onboarding state
    private val _hasCompletedOnboarding = MutableStateFlow(false)
    val hasCompletedOnboarding: StateFlow<Boolean> = _hasCompletedOnboarding.asStateFlow()

    // Holds current authenticating details
    val emailInput = MutableStateFlow("")
    val passwordInput = MutableStateFlow("")
    val nameInput = MutableStateFlow("")
    val phoneInput = MutableStateFlow("")
    val confirmPasswordInput = MutableStateFlow("")

    // Active logged-in user profile flow
    val currentUserFlow: StateFlow<UserEntity?> = _authState.flatMapLatest { state ->
        when (state) {
            is AuthState.Authenticated -> repository.getUserFlow(state.userId)
            else -> flowOf(null)
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    init {
        checkCurrentAuth()
    }

    fun completeOnboarding() {
        _hasCompletedOnboarding.value = true
        checkCurrentAuth()
    }

    private fun checkCurrentAuth() {
        if (!_hasCompletedOnboarding.value) {
            _authState.value = AuthState.Onboarding
            return
        }

        val fbUser = firebaseAuth?.currentUser
        if (fbUser != null) {
            _authState.value = AuthState.Authenticated(fbUser.uid)
        } else {
            // Check if there is an offline-saved guest user, else go to Unauthenticated
            _authState.value = AuthState.Unauthenticated
        }
    }

    fun login() {
        val email = emailInput.value.trim()
        val password = passwordInput.value

        if (email.isEmpty() || password.isEmpty()) {
            _authState.value = AuthState.Error("Please enter email and password")
            return
        }

        _authState.value = AuthState.Loading

        if (firebaseAuth != null) {
            firebaseAuth?.signInWithEmailAndPassword(email, password)
                ?.addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        val uid = task.result?.user?.uid ?: "local_guest_user"
                        viewModelScope.launch {
                            // Ensure user entry exists in Room database
                            val existing = repository.getUser(uid)
                            if (existing == null) {
                                repository.saveUser(
                                    UserEntity(
                                        id = uid,
                                        name = email.substringBefore("@"),
                                        email = email,
                                        phone = "",
                                        school = "",
                                        college = "",
                                        courseBranch = "",
                                        year = "",
                                        city = "",
                                        skills = "",
                                        linksPortfolio = "",
                                        linksLinkedIn = "",
                                        linksGitHub = "",
                                        bio = "Welcome to Chavee!"
                                    )
                                )
                            }
                            _authState.value = AuthState.Authenticated(uid)
                        }
                    } else {
                        val errorMsg = task.exception?.localizedMessage ?: "Login failed"
                        // Fallback to offline developer access for test demo email/passwords
                        if (email == "student@chavee.in" && password == "chavee123") {
                            loginLocalDemoUser("student_1")
                        } else {
                            _authState.value = AuthState.Error(errorMsg)
                        }
                    }
                }
        } else {
            // Absolute offline sandbox demo backup
            if (email.contains("@") && password.length >= 6) {
                loginLocalDemoUser("student_1")
            } else {
                _authState.value = AuthState.Error("Offline Sandbox: Enter any email and password of 6+ chars. Or use 'student@chavee.in' / 'chavee123'")
            }
        }
    }

    private fun loginLocalDemoUser(uid: String) {
        viewModelScope.launch {
            val existing = repository.getUser(uid)
            if (existing == null) {
                repository.saveUser(
                    UserEntity(
                        id = uid,
                        name = "Aarav Sharma",
                        email = "aarav@gmail.com",
                        phone = "9876543210",
                        school = "Engineering",
                        college = "IIT Madras",
                        courseBranch = "Computer Science",
                        year = "3rd Year",
                        city = "Chennai",
                        skills = "Kotlin, Jetpack Compose",
                        linksPortfolio = "",
                        linksLinkedIn = "",
                        linksGitHub = "",
                        bio = "Student seeking careers."
                    )
                )
            }
            _authState.value = AuthState.Authenticated(uid)
        }
    }

    fun signUp() {
        val name = nameInput.value.trim()
        val email = emailInput.value.trim()
        val phone = phoneInput.value.trim()
        val password = passwordInput.value
        val confirmPassword = confirmPasswordInput.value

        if (name.isEmpty() || email.isEmpty() || password.isEmpty() || phone.isEmpty()) {
            _authState.value = AuthState.Error("All fields are required")
            return
        }

        if (password != confirmPassword) {
            _authState.value = AuthState.Error("Passwords do not match")
            return
        }

        if (password.length < 6) {
            _authState.value = AuthState.Error("Password must be at least 6 characters")
            return
        }

        _authState.value = AuthState.Loading

        if (firebaseAuth != null) {
            firebaseAuth?.createUserWithEmailAndPassword(email, password)
                ?.addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        val uid = task.result?.user?.uid ?: "local_guest_user"
                        viewModelScope.launch {
                            val newUser = UserEntity(
                                id = uid,
                                name = name,
                                email = email,
                                phone = phone,
                                school = "Undergraduate",
                                college = "Enter College Name",
                                courseBranch = "Enter Field",
                                year = "1st Year",
                                city = "India",
                                skills = "",
                                linksPortfolio = "",
                                linksLinkedIn = "",
                                linksGitHub = "",
                                bio = "I am a student on Chavee platform."
                            )
                            repository.saveUser(newUser)
                            _authState.value = AuthState.Authenticated(uid)
                        }
                    } else {
                        _authState.value = AuthState.Error(task.exception?.localizedMessage ?: "Sign up failed")
                    }
                }
        } else {
            // Local Offline fallback
            viewModelScope.launch {
                val tempId = "student_" + System.currentTimeMillis()
                val newUser = UserEntity(
                    id = tempId,
                    name = name,
                    email = email,
                    phone = phone,
                    school = "Undergraduate",
                    college = "IIT Madras",
                    courseBranch = "Computer Science",
                    year = "1st Year",
                    city = "India",
                    skills = "Kotlin, Java",
                    linksPortfolio = "",
                    linksLinkedIn = "",
                    linksGitHub = "",
                    bio = "Newly registered student on Chavee!"
                )
                repository.saveUser(newUser)
                _authState.value = AuthState.Authenticated(tempId)
            }
        }
    }

    fun logout() {
        _authState.value = AuthState.Loading
        firebaseAuth?.signOut()
        _authState.value = AuthState.Unauthenticated
    }

    fun clearError() {
        val current = _authState.value
        if (current is AuthState.Error) {
            _authState.value = AuthState.Unauthenticated
        }
    }
}
