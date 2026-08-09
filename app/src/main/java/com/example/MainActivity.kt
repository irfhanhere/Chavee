package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.auth.*
import com.example.ui.main.*
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.theme.ForestGreen
import com.example.ui.theme.SoftOffWhite

class MainActivity : ComponentActivity() {

    private val authViewModel: AuthViewModel by viewModels()
    private val mainViewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                val authState by authViewModel.authState.collectAsState()
                val currentUser by authViewModel.currentUserFlow.collectAsState()

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = SoftOffWhite
                ) {
                    when (val state = authState) {
                        is AuthState.Loading -> {
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = "CHAVEE",
                                        color = ForestGreen,
                                        fontWeight = FontWeight.Black,
                                        fontSize = 36.sp,
                                        letterSpacing = 1.5.sp
                                    )
                                    Spacer(modifier = Modifier.height(16.dp))
                                    CircularProgressIndicator(color = ForestGreen)
                                }
                            }
                        }
                        is AuthState.Onboarding -> {
                            OnboardingScreen(
                                onComplete = { authViewModel.completeOnboarding() }
                            )
                        }
                        is AuthState.Unauthenticated, is AuthState.Error -> {
                            AuthScreen(
                                viewModel = authViewModel,
                                onNavigateToHome = { /* Navigation handled reactively by flow */ }
                            )
                        }
                        is AuthState.Authenticated -> {
                            ChaveeMainShell(
                                authViewModel = authViewModel,
                                mainViewModel = mainViewModel,
                                currentUserId = state.userId,
                                currentUser = currentUser
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ChaveeMainShell(
    authViewModel: AuthViewModel,
    mainViewModel: MainViewModel,
    currentUserId: String,
    currentUser: com.example.data.UserEntity?
) {
    var selectedTab by remember { mutableIntStateOf(0) } // 0=Home, 1=Learn, 2=Earn, 3=Network, 4=Events, 5=Profile (Indirect)

    val navigationItems = listOf(
        NavigationTab("Home", Icons.Default.Home, Icons.Outlined.Home, 0),
        NavigationTab("Learn", Icons.Default.Book, Icons.Outlined.Book, 1),
        NavigationTab("Earn", Icons.Default.Payments, Icons.Outlined.Payments, 2),
        NavigationTab("Network", Icons.Default.People, Icons.Outlined.People, 3),
        NavigationTab("Events", Icons.Default.CalendarMonth, Icons.Outlined.CalendarMonth, 4)
    )

    Scaffold(
        topBar = {
            ChaveeHeader(
                currentUser = currentUser,
                onProfileClick = { selectedTab = 5 }, // Profile Tab Indirect trigger
                modifier = Modifier.testTag("main_header")
            )
        },
        bottomBar = {
            // Customized Bottom Navigation Bar with exact spec:
            // "white background, subtle top border/shadow, icon + label per tab, active tab shown in accent green with a small dot indicator beneath the icon"
            Surface(
                color = Color.White,
                tonalElevation = 8.dp,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("chavee_bottom_navigation")
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .padding(vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceAround,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    navigationItems.forEach { item ->
                        val isSelected = selectedTab == item.index
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center,
                            modifier = Modifier
                                .clickable { selectedTab = item.index }
                                .padding(horizontal = 8.dp)
                                .testTag("bottom_tab_${item.name.lowercase()}")
                        ) {
                            Icon(
                                imageVector = if (isSelected) item.selectedIcon else item.unselectedIcon,
                                contentDescription = item.name,
                                tint = if (isSelected) ForestGreen else Color.Gray,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = item.name,
                                fontSize = 10.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                color = if (isSelected) ForestGreen else Color.Gray
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            // Dot indicator for active nav states
                            Box(
                                modifier = Modifier
                                    .size(4.dp)
                                    .clip(CircleShape)
                                    .background(if (isSelected) ForestGreen else Color.Transparent)
                            )
                        }
                    }
                }
            }
        },
        containerColor = SoftOffWhite
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (selectedTab) {
                0 -> HomeTabScreen(
                    viewModel = mainViewModel,
                    currentUserId = currentUserId,
                    onNavigateToScholarships = { selectedTab = 1 } // Redirects to Learn->Scholarships subtab
                )
                1 -> LearnTabScreen(
                    viewModel = mainViewModel
                )
                2 -> EarnTabScreen(
                    viewModel = mainViewModel,
                    currentUserId = currentUserId
                )
                3 -> NetworkTabScreen(
                    viewModel = mainViewModel,
                    currentUserId = currentUserId
                )
                4 -> EventsTabScreen(
                    viewModel = mainViewModel,
                    currentUserId = currentUserId
                )
                5 -> ProfileTabScreen(
                    viewModel = mainViewModel,
                    currentUser = currentUser,
                    onLogoutClick = { authViewModel.logout() },
                    onJumpToConnect = { selectedTab = 3 } // Jumps to Network->Connect tab
                )
            }
        }
    }
}

data class NavigationTab(
    val name: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector,
    val index: Int
)
