package com.example.ui.main

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

sealed class RegisterState {
    object Idle : RegisterState()
    object Loading : RegisterState()
    object Success : RegisterState()
    data class Error(val message: String) : RegisterState()
}

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val db = AppDatabase.getDatabase(application)
    val repository = ChaveeRepository(db)

    // Global Search State
    private val _searchQuery = MutableStateFlow("")
    val searchQuery = _searchQuery.asStateFlow()

    // Combined search results
    val postsFlow = repository.postsFlow
    val featuredPostFlow = repository.featuredPostFlow
    val statsFlow = repository.statsFlow
    val scholarshipsFlow = repository.scholarshipsFlow
    val coursesFlow = repository.coursesFlow
    val jobsFlow = repository.jobsFlow
    val gigsFlow = repository.gigsFlow
    val eventsFlow = repository.eventsFlow
    val communitiesFlow = repository.communitiesFlow

    // Event registration state
    private val _registerState = MutableStateFlow<RegisterState>(RegisterState.Idle)
    val registerState = _registerState.asStateFlow()

    // Search query setter
    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    // Likes
    fun toggleLike(postId: Int, userId: String, isCurrentlyLiked: Boolean) {
        viewModelScope.launch {
            repository.toggleLikePost(postId, userId, isCurrentlyLiked)
        }
    }

    // Comments
    fun getCommentsForPost(postId: Int): Flow<List<PostCommentEntity>> {
        return repository.getComments(postId)
    }

    fun submitComment(postId: Int, userId: String, userName: String, avatarUrl: String, text: String) {
        if (text.isBlank()) return
        viewModelScope.launch {
            repository.addComment(
                PostCommentEntity(
                    postId = postId,
                    userId = userId,
                    userName = userName,
                    userAvatar = avatarUrl,
                    commentText = text,
                    createdAt = System.currentTimeMillis()
                )
            )
        }
    }

    // Register for Live Event
    fun registerForEvent(
        eventId: Int,
        userId: String,
        upiTxnId: String,
        name: String,
        email: String,
        phone: String,
        screenshotPath: String = ""
    ) {
        if (upiTxnId.isBlank() || name.isBlank() || email.isBlank() || phone.isBlank()) {
            _registerState.value = RegisterState.Error("All registration fields are required.")
            return
        }

        viewModelScope.launch {
            _registerState.value = RegisterState.Loading
            try {
                repository.registerForEvent(
                    EventRegistrationEntity(
                        eventId = eventId,
                        userId = userId,
                        upiTxnId = upiTxnId,
                        paymentStatus = "Pending Verification",
                        screenshotPath = screenshotPath,
                        name = name,
                        email = email,
                        phone = phone
                    )
                )
                _registerState.value = RegisterState.Success
            } catch (e: Exception) {
                _registerState.value = RegisterState.Error(e.localizedMessage ?: "Failed to submit registration.")
            }
        }
    }

    fun resetRegisterState() {
        _registerState.value = RegisterState.Idle
    }

    // Submit Job Placement Request
    fun submitPlacementRequest(
        userId: String,
        name: String,
        college: String,
        course: String,
        year: String,
        skills: String
    ) {
        viewModelScope.launch {
            repository.addJob(
                JobEntity(
                    title = "Placement Request: $name",
                    type = "Placement Request",
                    company = college,
                    location = "India",
                    description = "Student $name ($course, Year $year) requests placement assistance. Skills: $skills",
                    salary = "N/A",
                    applyUrl = "",
                    status = "PENDING"
                )
            )
        }
    }

    // Propose / Suggest New Community
    fun suggestCommunity(name: String, description: String, isPaid: Boolean, price: Int) {
        viewModelScope.launch {
            repository.addCommunity(
                CommunityEntity(
                    name = name,
                    description = description,
                    isPaid = isPaid,
                    price = price,
                    memberCount = 1,
                    coverImage = "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=400"
                )
            )
        }
    }

    // Save customized profile
    fun updateProfile(user: UserEntity) {
        viewModelScope.launch {
            repository.updateUser(user)
        }
    }
}
