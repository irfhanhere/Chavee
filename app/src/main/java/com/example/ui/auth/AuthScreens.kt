package com.example.ui.auth

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun OnboardingScreen(
    onComplete: () -> Unit
) {
    val pagerState = rememberPagerState(pageCount = { 3 })
    val coroutineScope = rememberCoroutineScope()

    Scaffold(
        containerColor = SoftOffWhite
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .testTag("onboarding_screen")
        ) {
            // Top Bar with Skip Button
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // CHAVEE brand logo wordmark (top left)
                Text(
                    text = "CHAVEE",
                    color = ForestGreen,
                    fontWeight = FontWeight.Black,
                    fontSize = 24.sp,
                    letterSpacing = 1.sp
                )

                if (pagerState.currentPage < 2) {
                    Text(
                        text = "Skip",
                        color = MediumGreyBody,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 16.sp,
                        modifier = Modifier
                            .clickable { onComplete() }
                            .testTag("skip_button")
                    )
                }
            }

            // Pager content
            HorizontalPager(
                state = pagerState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) { page ->
                when (page) {
                    0 -> OnboardingSlide1()
                    1 -> OnboardingSlide2()
                    2 -> OnboardingSlide3()
                }
            }

            // Bottom Navigation Indicators & Next Arrow button
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 32.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Page Indicator
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    repeat(3) { index ->
                        val isSelected = pagerState.currentPage == index
                        Box(
                            modifier = Modifier
                                .size(if (isSelected) 24.dp else 8.dp, 8.dp)
                                .clip(CircleShape)
                                .background(if (isSelected) ForestGreen else PaleBorder)
                        )
                    }
                }

                // Next Button or Get Started Pill
                if (pagerState.currentPage < 2) {
                    IconButton(
                        onClick = {
                            coroutineScope.launch {
                                pagerState.animateScrollToPage(pagerState.currentPage + 1)
                            }
                        },
                        modifier = Modifier
                            .size(56.dp)
                            .background(ForestGreen, CircleShape)
                            .testTag("next_page_button")
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                            contentDescription = "Next Page",
                            tint = PureWhite
                        )
                    }
                } else {
                    Button(
                        onClick = onComplete,
                        colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                        shape = RoundedCornerShape(24.dp),
                        contentPadding = PaddingValues(horizontal = 24.dp, vertical = 14.dp),
                        modifier = Modifier.testTag("get_started_button")
                    ) {
                        Text(
                            text = "Get Started",
                            color = PureWhite,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun OnboardingSlide1() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(0.85f)
                .height(220.dp)
                .clip(RoundedCornerShape(24.dp))
                .background(ForestGreen),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "CHAVEE",
                    color = PureWhite,
                    fontWeight = FontWeight.Black,
                    fontSize = 42.sp,
                    letterSpacing = 2.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Career • Learning • Network",
                    color = PureWhite.copy(alpha = 0.85f),
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.sp
                )
            }
        }
        Spacer(modifier = Modifier.height(48.dp))
        Text(
            text = "Welcome to Chavee 👋",
            style = MaterialTheme.typography.displayLarge,
            fontSize = 28.sp,
            color = CharcoalHeading,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "India's premier all-in-one student platform for securing internships, learning essential skills, and growing networks with peers.",
            style = MaterialTheme.typography.bodyLarge,
            color = MediumGreyBody,
            textAlign = TextAlign.Center,
            lineHeight = 24.sp
        )
    }
}

@Composable
fun OnboardingSlide2() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Flat graphical mockup
        Box(
            modifier = Modifier
                .fillMaxWidth(0.85f)
                .height(220.dp)
                .clip(RoundedCornerShape(24.dp))
                .background(ForestGreenLight),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Mock Card 1
                Card(
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = PureWhite),
                    modifier = Modifier.fillMaxWidth().padding(4.dp)
                ) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(modifier = Modifier.size(36.dp).background(ForestGreen, CircleShape))
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text("Android Developer Intern", fontWeight = FontWeight.Bold, color = CharcoalHeading, fontSize = 12.sp)
                            Text("TechVantage Solutions • Bengaluru", color = MediumGreyBody, fontSize = 10.sp)
                        }
                    }
                }
                // Mock Card 2
                Card(
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = PureWhite),
                    modifier = Modifier.fillMaxWidth().padding(4.dp)
                ) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(modifier = Modifier.size(36.dp).background(SecondaryGreen, CircleShape))
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text("Figma Landing Page Gig", fontWeight = FontWeight.Bold, color = CharcoalHeading, fontSize = 12.sp)
                            Text("Earn ₹3,000 • 2 days left", color = ForestGreen, fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }
        }
        Spacer(modifier = Modifier.height(48.dp))
        Text(
            text = "Find Your Dream Job & Gigs",
            style = MaterialTheme.typography.displayLarge,
            fontSize = 26.sp,
            color = CharcoalHeading,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "Browse through curated, admin-vetted internships, full-time student openings, and easy freelance tasks to boost your monthly pocket income.",
            style = MaterialTheme.typography.bodyLarge,
            color = MediumGreyBody,
            textAlign = TextAlign.Center,
            lineHeight = 24.sp
        )
    }
}

@Composable
fun OnboardingSlide3() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Flat illustration placeholder
        Box(
            modifier = Modifier
                .fillMaxWidth(0.85f)
                .height(220.dp)
                .clip(RoundedCornerShape(24.dp))
                .background(ForestGreenLight),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "🌐 Connect & Learn",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = ForestGreen
                )
                Spacer(modifier = Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Box(modifier = Modifier.size(40.dp).background(ForestGreen, CircleShape), contentAlignment = Alignment.Center) {
                        Text("DE", color = PureWhite, fontWeight = FontWeight.Bold)
                    }
                    Box(modifier = Modifier.size(40.dp).background(SecondaryGreen, CircleShape), contentAlignment = Alignment.Center) {
                        Text("KR", color = PureWhite, fontWeight = FontWeight.Bold)
                    }
                    Box(modifier = Modifier.size(40.dp).background(TertiaryGreen, CircleShape), contentAlignment = Alignment.Center) {
                        Text("IN", color = PureWhite, fontWeight = FontWeight.Bold)
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "German Course (Coming Soon) • Korean Course (July 29)",
                    fontSize = 11.sp,
                    color = CharcoalHeading,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
        Spacer(modifier = Modifier.height(48.dp))
        Text(
            text = "Bilingual Skills & Peer Networks",
            style = MaterialTheme.typography.displayLarge,
            fontSize = 26.sp,
            color = CharcoalHeading,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "Join language study circles, find verified study swaps, prepare for scholarship opportunities, and chat with fellow campus leaders.",
            style = MaterialTheme.typography.bodyLarge,
            color = MediumGreyBody,
            textAlign = TextAlign.Center,
            lineHeight = 24.sp
        )
    }
}


@Composable
fun AuthScreen(
    viewModel: AuthViewModel,
    onNavigateToHome: () -> Unit
) {
    val authState by viewModel.authState.collectAsState()
    var isSignUpMode by remember { mutableStateOf(false) }

    LaunchedEffect(authState) {
        if (authState is AuthState.Authenticated) {
            onNavigateToHome()
        }
    }

    Scaffold(
        containerColor = SoftOffWhite
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(24.dp)
                .testTag("auth_screen"),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                // Wordmark Logo Header
                Text(
                    text = "CHAVEE",
                    color = ForestGreen,
                    fontWeight = FontWeight.Black,
                    fontSize = 36.sp,
                    letterSpacing = 1.5.sp
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "India's Student Platform",
                    color = MediumGreyBody,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )

                Spacer(modifier = Modifier.height(32.dp))

                // Card container
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .shadow(8.dp, RoundedCornerShape(20.dp))
                        .border(1.dp, PaleBorder, RoundedCornerShape(20.dp))
                        .testTag("auth_card"),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = PureWhite)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = if (isSignUpMode) "Create Account 📝" else "Welcome Back 👋",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = CharcoalHeading
                        )
                        Spacer(modifier = Modifier.height(24.dp))

                        // Input fields
                        if (isSignUpMode) {
                            val name by viewModel.nameInput.collectAsState()
                            val phone by viewModel.phoneInput.collectAsState()

                            OutlinedTextField(
                                value = name,
                                onValueChange = { viewModel.nameInput.value = it },
                                label = { Text("Full Name") },
                                leadingIcon = { Icon(Icons.Default.Person, contentDescription = null, tint = ForestGreen) },
                                modifier = Modifier.fillMaxWidth().testTag("name_input"),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = ForestGreen,
                                    focusedLabelColor = ForestGreen
                                )
                            )
                            Spacer(modifier = Modifier.height(12.dp))

                            OutlinedTextField(
                                value = phone,
                                onValueChange = { viewModel.phoneInput.value = it },
                                label = { Text("Phone Number") },
                                leadingIcon = { Icon(Icons.Default.Phone, contentDescription = null, tint = ForestGreen) },
                                modifier = Modifier.fillMaxWidth().testTag("phone_input"),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = ForestGreen,
                                    focusedLabelColor = ForestGreen
                                )
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                        }

                        val email by viewModel.emailInput.collectAsState()
                        val password by viewModel.passwordInput.collectAsState()

                        OutlinedTextField(
                            value = email,
                            onValueChange = { viewModel.emailInput.value = it },
                            label = { Text("Email Address") },
                            leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = ForestGreen) },
                            modifier = Modifier.fillMaxWidth().testTag("email_input"),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = ForestGreen,
                                focusedLabelColor = ForestGreen
                            )
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = password,
                            onValueChange = { viewModel.passwordInput.value = it },
                            label = { Text("Password") },
                            leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = ForestGreen) },
                            visualTransformation = PasswordVisualTransformation(),
                            modifier = Modifier.fillMaxWidth().testTag("password_input"),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = ForestGreen,
                                focusedLabelColor = ForestGreen
                            )
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        if (isSignUpMode) {
                            val confirmPassword by viewModel.confirmPasswordInput.collectAsState()
                            OutlinedTextField(
                                value = confirmPassword,
                                onValueChange = { viewModel.confirmPasswordInput.value = it },
                                label = { Text("Re-type Password") },
                                leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = ForestGreen) },
                                visualTransformation = PasswordVisualTransformation(),
                                modifier = Modifier.fillMaxWidth().testTag("confirm_password_input"),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = ForestGreen,
                                    focusedLabelColor = ForestGreen
                                )
                            )
                            Spacer(modifier = Modifier.height(20.dp))
                        } else {
                            // Forgot Password Link
                            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterEnd) {
                                Text(
                                    text = "Forgot Password?",
                                    fontSize = 12.sp,
                                    color = ForestGreen,
                                    fontWeight = FontWeight.SemiBold,
                                    modifier = Modifier.clickable {
                                        // Demo info trigger
                                    }
                                )
                            }
                            Spacer(modifier = Modifier.height(20.dp))
                        }

                        // Display Errors gracefully
                        if (authState is AuthState.Error) {
                            Text(
                                text = (authState as AuthState.Error).message,
                                color = MaterialTheme.colorScheme.error,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.padding(bottom = 12.dp)
                            )
                        }

                        // Action Button
                        if (authState is AuthState.Loading) {
                            CircularProgressIndicator(color = ForestGreen)
                        } else {
                            Button(
                                onClick = {
                                    if (isSignUpMode) {
                                        viewModel.signUp()
                                    } else {
                                        viewModel.login()
                                    }
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp)
                                    .testTag("submit_auth_button"),
                                shape = RoundedCornerShape(24.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = ForestGreen)
                            ) {
                                Text(
                                    text = if (isSignUpMode) "Sign Up" else "Log In",
                                    color = PureWhite,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Divider
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(vertical = 8.dp)
                        ) {
                            HorizontalDivider(modifier = Modifier.weight(1f), color = PaleBorder)
                            Text(
                                text = " Or Login With ",
                                color = MediumGreyBody,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                            HorizontalDivider(modifier = Modifier.weight(1f), color = PaleBorder)
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Google Sign-In Icon Action
                        Button(
                            onClick = {
                                // Google Sign-in demo action
                                viewModel.emailInput.value = "student@chavee.in"
                                viewModel.passwordInput.value = "chavee123"
                                viewModel.login()
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(44.dp)
                                .border(1.dp, PaleBorder, RoundedCornerShape(22.dp))
                                .testTag("google_login_button"),
                            shape = RoundedCornerShape(22.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = PureWhite)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "G ",
                                    color = Color(0xFFEA4335),
                                    fontWeight = FontWeight.Black,
                                    fontSize = 18.sp
                                )
                                Text(
                                    text = "Continue with Google",
                                    color = CharcoalHeading,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 13.sp
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        // Toggle Mode Link
                        Row(horizontalArrangement = Arrangement.Center) {
                            Text(
                                text = if (isSignUpMode) "Already have an account? " else "Don't have an account? ",
                                fontSize = 13.sp,
                                color = MediumGreyBody
                            )
                            Text(
                                text = if (isSignUpMode) "Sign In" else "Sign Up",
                                fontSize = 13.sp,
                                color = ForestGreen,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier
                                    .clickable {
                                        viewModel.clearError()
                                        isSignUpMode = !isSignUpMode
                                    }
                                    .testTag("toggle_auth_mode")
                            )
                        }
                    }
                }
            }
        }
    }
}
