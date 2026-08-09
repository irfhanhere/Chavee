package com.example.ui.main

import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.example.data.UserEntity
import com.example.ui.theme.*

@Composable
fun ProfileTabScreen(
    viewModel: MainViewModel,
    currentUser: UserEntity?,
    onLogoutClick: () -> Unit,
    onJumpToConnect: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var isEditMode by remember { mutableStateOf(false) }

    // Live Dashboard stats from db
    val followersCount by viewModel.repository.getFollowersCount(currentUser?.id ?: "").collectAsState(initial = 24)
    val followingCount by viewModel.repository.getFollowingCount(currentUser?.id ?: "").collectAsState(initial = 12)
    val confirmedEventsCount by viewModel.repository.getConfirmedEventCount(currentUser?.id ?: "").collectAsState(initial = 0)

    // Expandable settings states
    var showTerms by remember { mutableStateOf(false) }
    var showPrivacy by remember { mutableStateOf(false) }
    var showSupport by remember { mutableStateOf(false) }

    if (currentUser == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = ForestGreen)
        }
        return
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(SoftOffWhite)
            .testTag("profile_tab_screen"),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Profile header card
        item {
            Spacer(modifier = Modifier.height(16.dp))
            Card(
                colors = CardDefaults.cardColors(containerColor = PureWhite),
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(2.dp, RoundedCornerShape(20.dp))
                    .border(1.dp, PaleBorder, RoundedCornerShape(20.dp))
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(modifier = Modifier.fillMaxWidth()) {
                        IconButton(
                            onClick = { isEditMode = true },
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .testTag("edit_profile_pencil_button")
                        ) {
                            Icon(Icons.Default.Edit, contentDescription = "Edit Profile", tint = ForestGreen)
                        }
                    }

                    // Circular avatar with light green halo
                    Box(
                        modifier = Modifier
                            .size(90.dp)
                            .border(3.dp, ForestGreen, CircleShape)
                            .padding(4.dp)
                            .clip(CircleShape)
                    ) {
                        if (currentUser.avatarUrl.isNotEmpty()) {
                            AsyncImage(
                                model = ImageRequest.Builder(context)
                                    .data(currentUser.avatarUrl)
                                    .crossfade(true)
                                    .build(),
                                contentDescription = null,
                                modifier = Modifier.fillMaxSize()
                            )
                        } else {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(ForestGreenLight),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = currentUser.name.take(1).uppercase(),
                                    fontSize = 32.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = ForestGreen
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = currentUser.name,
                        fontWeight = FontWeight.Black,
                        fontSize = 20.sp,
                        color = CharcoalHeading
                    )

                    Text(
                        text = currentUser.bio.ifEmpty { "Engineering Student • Tech Enthusiast" },
                        color = MediumGreyBody,
                        fontSize = 13.sp,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Box(
                        modifier = Modifier
                            .background(ForestGreenLight, RoundedCornerShape(12.dp))
                            .padding(horizontal = 12.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = currentUser.college.ifEmpty { "IIT Madras" },
                            color = ForestGreen,
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }
        }

        // 2. Dashboard Statistics section (Live grid)
        item {
            Text("Dashboard Statistics 📊", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = CharcoalHeading)
            Spacer(modifier = Modifier.height(8.dp))

            val stats = listOf(
                DashboardStat("Total Earnings", "₹3,500"),
                DashboardStat("Followers", followersCount.toString()),
                DashboardStat("Following", followingCount.toString()),
                DashboardStat("Events Attended", confirmedEventsCount.toString()),
                DashboardStat("Courses Taken", "0"),
                DashboardStat("Gigs Completed", "1")
            )

            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                // Renders 2x3 grid manually using rows
                for (i in stats.indices step 2) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        StatBox(stat = stats[i], modifier = Modifier.weight(1f))
                        if (i + 1 < stats.size) {
                            StatBox(stat = stats[i + 1], modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
        }

        // 3. Gamification Points Bar and Badges
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = PureWhite),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(2.dp, RoundedCornerShape(16.dp))
                    .border(1.dp, PaleBorder, RoundedCornerShape(16.dp))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Chavee Rewards 🏆", fontWeight = FontWeight.Bold, color = ForestGreen, fontSize = 15.sp)
                        Text("${currentUser.xpPoints} XP (Level 2)", fontWeight = FontWeight.Bold, color = CharcoalHeading, fontSize = 12.sp)
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Progress bar
                    LinearProgressIndicator(
                        progress = { (currentUser.xpPoints % 500) / 500f },
                        color = ForestGreen,
                        trackColor = SoftOffWhite,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp))
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Text("Badges Claimed:", fontWeight = FontWeight.Bold, color = CharcoalHeading, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(8.dp))

                    // Horizontal badges row
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        BadgePill("🚀 Early Adopter")
                        BadgePill("💼 First Gig")
                        BadgePill("👥 Community Lead")
                    }
                }
            }
        }

        // 4. People You May Know shortcuts
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("People You May Know 🤝", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = CharcoalHeading)
                Text(
                    text = "See All",
                    color = ForestGreen,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    modifier = Modifier.clickable { onJumpToConnect() }
                )
            }
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                val suggestions = listOf(
                    PeopleSuggestion("Rohan Verma", "BITS Pilani", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120"),
                    PeopleSuggestion("Ananya Sen", "St. Xavier's", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"),
                    PeopleSuggestion("Kabir Mehta", "IIT Bombay", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120")
                )

                suggestions.forEach { person ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = PureWhite),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .width(140.dp)
                            .border(1.dp, PaleBorder, RoundedCornerShape(12.dp))
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            AsyncImage(
                                model = ImageRequest.Builder(context)
                                    .data(person.avatarUrl)
                                    .crossfade(true)
                                    .build(),
                                contentDescription = null,
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(CircleShape)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(person.name, fontWeight = FontWeight.Bold, color = CharcoalHeading, fontSize = 12.sp, maxLines = 1)
                            Text(person.college, color = MediumGreyBody, fontSize = 10.sp, maxLines = 1)
                            Spacer(modifier = Modifier.height(8.dp))
                            Button(
                                onClick = { Toast.makeText(context, "Following ${person.name}", Toast.LENGTH_SHORT).show() },
                                colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 2.dp),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.height(24.dp)
                            ) {
                                Text("Follow", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // 5. Settings drawers (Change Password, Terms, Privacy, Support, Log Out)
        item {
            Text("Preferences & Support ⚙️", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = CharcoalHeading)
            Spacer(modifier = Modifier.height(8.dp))

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(PureWhite)
                    .border(1.dp, PaleBorder, RoundedCornerShape(16.dp))
            ) {
                // Change Password placeholder
                SettingRowItem(title = "Change Password", icon = { Icon(Icons.Default.Lock, contentDescription = null, tint = ForestGreen) }) {
                    Toast.makeText(context, "Change password verification mail dispatched!", Toast.LENGTH_LONG).show()
                }
                HorizontalDivider(color = PaleBorder)

                // Terms & Conditions Drawer
                SettingDrawerItem(title = "Terms & Conditions", isExpanded = showTerms, onClick = { showTerms = !showTerms }) {
                    Text(
                        text = "Chavee Platform Student Terms:\n1. This platform connects verified Indian collegiate students to career options, freelance tasks, and bilingual communities.\n2. Users must submit correct registration, college profiles, and verified manual UPI details.\n3. Content violating guidelines will be banned.",
                        fontSize = 11.sp,
                        color = MediumGreyBody,
                        modifier = Modifier.padding(16.dp),
                        lineHeight = 16.sp
                    )
                }
                HorizontalDivider(color = PaleBorder)

                // Privacy Policy Drawer
                SettingDrawerItem(title = "Privacy Policy", isExpanded = showPrivacy, onClick = { showPrivacy = !showPrivacy }) {
                    Text(
                        text = "Privacy Commitment:\n1. Chavee does not share private telephone numbers or verified student academic documents with external corporate vendors without prior explicit consent.\n2. Profiles are private unless explicitly followed on peer discovery dashboards.",
                        fontSize = 11.sp,
                        color = MediumGreyBody,
                        modifier = Modifier.padding(16.dp),
                        lineHeight = 16.sp
                    )
                }
                HorizontalDivider(color = PaleBorder)

                // Help Desk / Support Form
                SettingDrawerItem(title = "Help Desk & Support", isExpanded = showSupport, onClick = { showSupport = !showSupport }) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        var ticketText by remember { mutableStateOf("") }
                        OutlinedTextField(
                            value = ticketText,
                            onValueChange = { ticketText = it },
                            placeholder = { Text("Describe your support query or UPI verification issue...") },
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ForestGreen),
                            modifier = Modifier.fillMaxWidth().height(100.dp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(
                            onClick = {
                                Toast.makeText(context, "Support ticket dispatched successfully!", Toast.LENGTH_SHORT).show()
                                ticketText = ""
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Submit Ticket", fontSize = 12.sp)
                        }
                    }
                }
                HorizontalDivider(color = PaleBorder)

                // Log out Button
                SettingRowItem(
                    title = "Log Out",
                    icon = { Icon(Icons.Default.ExitToApp, contentDescription = null, tint = Color(0xFFEA4335)) },
                    textColor = Color(0xFFEA4335),
                    onRowClick = onLogoutClick
                )
            }
        }
    }

    // Modal: Edit Profile Dialog
    if (isEditMode) {
        EditProfileModal(
            currentUser = currentUser,
            onDismiss = { isEditMode = false },
            onSave = { updatedUser ->
                viewModel.updateProfile(updatedUser)
                Toast.makeText(context, "Profile updated successfully!", Toast.LENGTH_SHORT).show()
                isEditMode = false
            }
        )
    }
}

@Composable
fun StatBox(
    stat: DashboardStat,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = PureWhite),
        shape = RoundedCornerShape(12.dp),
        modifier = modifier
            .border(1.dp, PaleBorder, RoundedCornerShape(12.dp))
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(stat.value, fontWeight = FontWeight.Black, fontSize = 18.sp, color = ForestGreen)
            Spacer(modifier = Modifier.height(2.dp))
            Text(stat.title, color = MediumGreyBody, fontSize = 11.sp, textAlign = TextAlign.Center)
        }
    }
}

@Composable
fun BadgePill(text: String) {
    Box(
        modifier = Modifier
            .background(ForestGreenLight, RoundedCornerShape(12.dp))
            .border(1.dp, ForestGreen.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
            .padding(horizontal = 10.dp, vertical = 6.dp)
    ) {
        Text(text, color = ForestGreen, fontSize = 11.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun SettingRowItem(
    title: String,
    icon: @Composable () -> Unit,
    textColor: Color = CharcoalHeading,
    onRowClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onRowClick() }
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            icon()
            Spacer(modifier = Modifier.width(12.dp))
            Text(title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = textColor)
        }
        Icon(Icons.Default.ChevronRight, contentDescription = null, tint = MediumGreyBody, modifier = Modifier.size(16.dp))
    }
}

@Composable
fun SettingDrawerItem(
    title: String,
    isExpanded: Boolean,
    onClick: () -> Unit,
    content: @Composable () -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onClick() }
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.size(24.dp), contentAlignment = Alignment.Center) {
                    Text("📄", fontSize = 16.sp)
                }
                Spacer(modifier = Modifier.width(12.dp))
                Text(title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = CharcoalHeading)
            }
            Icon(
                imageVector = if (isExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                contentDescription = null,
                tint = MediumGreyBody,
                modifier = Modifier.size(20.dp)
            )
        }
        AnimatedVisibility(
            visible = isExpanded,
            enter = expandVertically() + fadeIn(),
            exit = shrinkVertically() + fadeOut()
        ) {
            Box(modifier = Modifier.background(SoftOffWhite)) {
                content()
            }
        }
    }
}

data class DashboardStat(
    val title: String,
    val value: String
)

data class PeopleSuggestion(
    val name: String,
    val college: String,
    val avatarUrl: String
)

@Composable
fun EditProfileModal(
    currentUser: UserEntity,
    onDismiss: () -> Unit,
    onSave: (UserEntity) -> Unit
) {
    var name by remember { mutableStateOf(currentUser.name) }
    var bio by remember { mutableStateOf(currentUser.bio) }
    var college by remember { mutableStateOf(currentUser.college) }
    var courseBranch by remember { mutableStateOf(currentUser.courseBranch) }
    var year by remember { mutableStateOf(currentUser.year) }
    var city by remember { mutableStateOf(currentUser.city) }
    var skills by remember { mutableStateOf(currentUser.skills) }
    var linksPortfolio by remember { mutableStateOf(currentUser.linksPortfolio) }
    var linksLinkedIn by remember { mutableStateOf(currentUser.linksLinkedIn) }
    var linksGitHub by remember { mutableStateOf(currentUser.linksGitHub) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = PureWhite),
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .border(1.dp, PaleBorder, RoundedCornerShape(20.dp))
        ) {
            Column(modifier = Modifier.padding(24.dp)) {
                Text(
                    text = "Edit Profile 📝",
                    fontWeight = FontWeight.Black,
                    fontSize = 18.sp,
                    color = ForestGreen
                )
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Full Name") }, modifier = Modifier.fillMaxWidth())
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(value = bio, onValueChange = { bio = it }, label = { Text("Tagline / Bio") }, modifier = Modifier.fillMaxWidth())
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(value = college, onValueChange = { college = it }, label = { Text("College Name") }, modifier = Modifier.fillMaxWidth())
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(value = courseBranch, onValueChange = { courseBranch = it }, label = { Text("Course / Branch") }, modifier = Modifier.fillMaxWidth())
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(value = year, onValueChange = { year = it }, label = { Text("Study Year") }, modifier = Modifier.fillMaxWidth())
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(value = city, onValueChange = { city = it }, label = { Text("City") }, modifier = Modifier.fillMaxWidth())
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(value = skills, onValueChange = { skills = it }, label = { Text("Skills (comma separated)") }, modifier = Modifier.fillMaxWidth())
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(value = linksPortfolio, onValueChange = { linksPortfolio = it }, label = { Text("Portfolio Website") }, modifier = Modifier.fillMaxWidth())
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(value = linksLinkedIn, onValueChange = { linksLinkedIn = it }, label = { Text("LinkedIn Link") }, modifier = Modifier.fillMaxWidth())
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(value = linksGitHub, onValueChange = { linksGitHub = it }, label = { Text("GitHub Link") }, modifier = Modifier.fillMaxWidth())

                Spacer(modifier = Modifier.height(24.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Button(
                        onClick = onDismiss,
                        colors = ButtonDefaults.buttonColors(containerColor = SoftOffWhite, contentColor = CharcoalHeading),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cancel")
                    }
                    Button(
                        onClick = {
                            onSave(
                                currentUser.copy(
                                    name = name,
                                    bio = bio,
                                    college = college,
                                    courseBranch = courseBranch,
                                    year = year,
                                    city = city,
                                    skills = skills,
                                    linksPortfolio = linksPortfolio,
                                    linksLinkedIn = linksLinkedIn,
                                    linksGitHub = linksGitHub
                                )
                            )
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                        modifier = Modifier.weight(1.5f),
                        enabled = name.isNotBlank()
                    ) {
                        Text("Save Profile")
                    }
                }
            }
        }
    }
}
