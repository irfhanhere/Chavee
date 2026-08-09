package com.example.ui.main

import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.People
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import kotlinx.coroutines.launch
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.example.data.CommunityEntity
import com.example.data.PostEntity
import com.example.data.UserEntity
import com.example.ui.theme.*

@Composable
fun NetworkTabScreen(
    viewModel: MainViewModel,
    currentUserId: String,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    var activeSubTab by remember { mutableStateOf(0) } // 0 = Feed, 1 = Connect, 2 = Communities
    val posts by viewModel.postsFlow.collectAsState(initial = emptyList())
    val communities by viewModel.communitiesFlow.collectAsState(initial = emptyList())
    val context = LocalContext.current

    var showPostComposer by remember { mutableStateOf(false) }
    var showSuggestCommunityForm by remember { mutableStateOf(false) }

    // Mock students for connect tab
    val mockStudents = remember {
        mutableStateListOf(
            DiscoverStudent("student_2", "Priya Patel", "SRCC Delhi", "B.Com", "New Delhi", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120", false),
            DiscoverStudent("student_3", "Rohan Verma", "BITS Pilani", "Mechanical", "Pilani", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120", false),
            DiscoverStudent("student_4", "Ananya Sen", "St. Xavier's Kolkata", "Economics", "Kolkata", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120", false),
            DiscoverStudent("student_5", "Kabir Mehta", "IIT Bombay", "Electrical Eng", "Mumbai", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120", false)
        )
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(SoftOffWhite)
            .testTag("network_tab_screen")
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Social Subtabs
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(PureWhite)
                    .padding(horizontal = 8.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                val subTabs = listOf("Feed 📱", "Connect 🌐", "Communities 👥")
                subTabs.forEachIndexed { index, title ->
                    Button(
                        onClick = { activeSubTab = index },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (activeSubTab == index) ForestGreen else SoftOffWhite,
                            contentColor = if (activeSubTab == index) PureWhite else MediumGreyBody
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            title,
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp,
                            maxLines = 1,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            when (activeSubTab) {
                0 -> {
                    // SOCIAL FEED VIEW
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(bottom = 96.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(posts) { post ->
                            PostCardItem(
                                post = post,
                                currentUserId = currentUserId,
                                hasLikedFlow = viewModel.repository.hasLikedPost(post.id, currentUserId),
                                onLikeClick = { viewModel.toggleLike(post.id, currentUserId, it) },
                                onCommentClick = {
                                    // Trigger comment dialogue handled on parent, or simple toast for now
                                    Toast.makeText(context, "Tap post comment bubble on Home tab to reply!", Toast.LENGTH_SHORT).show()
                                }
                            )
                        }
                    }
                }
                1 -> {
                    // CONNECT / PEOPLE-DISCOVERY GRID VIEW
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 96.dp)
                    ) {
                        item {
                            Text("Discover Peer Students 🌐", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = CharcoalHeading)
                            Text("Connect with undergrads and campus captains in your area.", color = MediumGreyBody, fontSize = 12.sp)
                            Spacer(modifier = Modifier.height(16.dp))
                        }

                        // We can display custom list cards
                        items(mockStudents) { student ->
                            ConnectStudentCard(
                                student = student,
                                onFollowToggle = {
                                    student.isFollowing = !student.isFollowing
                                    // simple trigger
                                    Toast.makeText(context, if (student.isFollowing) "Following ${student.name}" else "Unfollowed ${student.name}", Toast.LENGTH_SHORT).show()
                                }
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                        }
                    }
                }
                2 -> {
                    // COMMUNITIES GRID VIEW
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 96.dp)
                    ) {
                        item {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text("Student Communities 👥", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = CharcoalHeading)
                                    Text("Join free or premium circles.", color = MediumGreyBody, fontSize = 12.sp)
                                }
                                Button(
                                    onClick = { showSuggestCommunityForm = true },
                                    colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                                    shape = RoundedCornerShape(12.dp),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Text("Suggest New", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                        }

                        items(communities) { community ->
                            CommunityCardItem(
                                community = community,
                                onJoinClick = {
                                    if (community.isPaid) {
                                        Toast.makeText(context, "Premium communities require manual verification. Request submitted!", Toast.LENGTH_LONG).show()
                                    } else {
                                        Toast.makeText(context, "Successfully joined ${community.name}!", Toast.LENGTH_SHORT).show()
                                    }
                                }
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                        }
                    }
                }
            }
        }

        // Floating Action Button for Post Composer (Visible on Social Feed tab)
        if (activeSubTab == 0) {
            FloatingActionButton(
                onClick = { showPostComposer = true },
                containerColor = ForestGreen,
                contentColor = PureWhite,
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(bottom = 96.dp, end = 20.dp)
                    .testTag("floating_composer_button")
            ) {
                Icon(Icons.Default.Add, contentDescription = "Create Post")
            }
        }
    }

    // Dialog: Create Social Post Form
    if (showPostComposer) {
        PostComposerDialog(
            onSubmit = { text, imageUrl ->
                coroutineScope.launch {
                    viewModel.repository.insertPost(
                        PostEntity(
                            authorId = currentUserId,
                            authorName = "Aarav Sharma", // Current logged in user details
                            authorAvatar = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120",
                            content = text,
                            mediaUrl = imageUrl,
                            createdAt = System.currentTimeMillis(),
                            isFeatured = false
                        )
                    )
                    Toast.makeText(context, "Post published successfully!", Toast.LENGTH_SHORT).show()
                    showPostComposer = false
                }
            },
            onDismiss = { showPostComposer = false }
        )
    }

    // Dialog: Suggest New Community Form
    if (showSuggestCommunityForm) {
        SuggestCommunityDialog(
            onSubmit = { name, desc, isPaid, price ->
                viewModel.suggestCommunity(name, desc, isPaid, price)
                Toast.makeText(context, "Suggested community '$name' sent for approval!", Toast.LENGTH_LONG).show()
                showSuggestCommunityForm = false
            },
            onDismiss = { showSuggestCommunityForm = false }
        )
    }
}

@Composable
fun ConnectStudentCard(
    student: DiscoverStudent,
    onFollowToggle: () -> Unit
) {
    var followingState by remember { mutableStateOf(student.isFollowing) }

    Card(
        colors = CardDefaults.cardColors(containerColor = PureWhite),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier
            .fillMaxWidth()
            .shadow(2.dp, RoundedCornerShape(16.dp))
            .border(1.dp, PaleBorder, RoundedCornerShape(16.dp))
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(student.avatarUrl)
                    .crossfade(true)
                    .build(),
                contentDescription = null,
                modifier = Modifier
                    .size(50.dp)
                    .clip(CircleShape)
            )
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(student.name, fontWeight = FontWeight.Bold, color = CharcoalHeading, fontSize = 15.sp)
                Text("${student.college} • ${student.course}", color = MediumGreyBody, fontSize = 12.sp)
                Text(student.city, color = ForestGreen, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
            }
            Spacer(modifier = Modifier.width(8.dp))
            Button(
                onClick = {
                    followingState = !followingState
                    onFollowToggle()
                },
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (followingState) SoftOffWhite else ForestGreen,
                    contentColor = if (followingState) CharcoalHeading else PureWhite
                ),
                shape = RoundedCornerShape(16.dp),
                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
            ) {
                Text(if (followingState) "Following" else "Follow", fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun CommunityCardItem(
    community: CommunityEntity,
    onJoinClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = PureWhite),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier
            .fillMaxWidth()
            .shadow(2.dp, RoundedCornerShape(16.dp))
            .border(1.dp, PaleBorder, RoundedCornerShape(16.dp))
    ) {
        Column {
            if (community.coverImage.isNotEmpty()) {
                AsyncImage(
                    model = ImageRequest.Builder(LocalContext.current)
                        .data(community.coverImage)
                        .crossfade(true)
                        .build(),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(100.dp)
                        .clip(RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
                )
            }

            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${community.memberCount} Members",
                        fontSize = 11.sp,
                        color = MediumGreyBody,
                        fontWeight = FontWeight.SemiBold
                    )

                    Box(
                        modifier = Modifier
                            .background(if (community.isPaid) Color(0xFFFEECEB) else ForestGreenLight, RoundedCornerShape(8.dp))
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = if (community.isPaid) "Paid • ₹${community.price}" else "Free 🔓",
                            color = if (community.isPaid) Color(0xFFEA4335) else ForestGreen,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                Text(community.name, fontWeight = FontWeight.Bold, color = CharcoalHeading, fontSize = 16.sp)
                Spacer(modifier = Modifier.height(4.dp))
                Text(community.description, color = MediumGreyBody, fontSize = 13.sp, lineHeight = 18.sp)

                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = onJoinClick,
                    colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Join Community", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

class DiscoverStudent(
    val id: String,
    val name: String,
    val college: String,
    val course: String,
    val city: String,
    val avatarUrl: String,
    var isFollowing: Boolean
)

@Composable
fun PostComposerDialog(
    onSubmit: (String, String) -> Unit,
    onDismiss: () -> Unit
) {
    var text by remember { mutableStateOf("") }
    var imageUrl by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = PureWhite),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, PaleBorder, RoundedCornerShape(20.dp))
        ) {
            Column(modifier = Modifier.padding(24.dp)) {
                Text("Compose New Post 📝", fontWeight = FontWeight.Black, fontSize = 18.sp, color = ForestGreen)
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = text,
                    onValueChange = { text = it },
                    placeholder = { Text("What's on your mind? Share study tips, job links, or carrier queries...") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(120.dp),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ForestGreen),
                    maxLines = 5
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = imageUrl,
                    onValueChange = { imageUrl = it },
                    placeholder = { Text("Image URL attachment (optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ForestGreen),
                    singleLine = true
                )

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
                        onClick = { onSubmit(text, imageUrl) },
                        colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                        modifier = Modifier.weight(1.5f),
                        enabled = text.isNotBlank()
                    ) {
                        Text("Publish Post")
                    }
                }
            }
        }
    }
}

@Composable
fun SuggestCommunityDialog(
    onSubmit: (String, String, Boolean, Int) -> Unit,
    onDismiss: () -> Unit
) {
    var name by remember { mutableStateOf("") }
    var desc by remember { mutableStateOf("") }
    var isPaid by remember { mutableStateOf(false) }
    var priceInput by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = PureWhite),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, PaleBorder, RoundedCornerShape(20.dp))
        ) {
            Column(modifier = Modifier.padding(24.dp)) {
                Text("Suggest Student Community 🚀", fontWeight = FontWeight.Black, fontSize = 18.sp, color = ForestGreen)
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Community Name") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ForestGreen)
                )
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = desc,
                    onValueChange = { desc = it },
                    label = { Text("Description / Objective") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ForestGreen)
                )
                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Checkbox(
                        checked = isPaid,
                        onCheckedChange = { isPaid = it },
                        colors = CheckboxDefaults.colors(checkedColor = ForestGreen)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Paid Premium community", fontSize = 13.sp, color = CharcoalHeading)
                }

                if (isPaid) {
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = priceInput,
                        onValueChange = { priceInput = it },
                        label = { Text("One-time Price (₹)") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ForestGreen)
                    )
                }

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
                        onClick = { onSubmit(name, desc, isPaid, priceInput.toIntOrNull() ?: 0) },
                        colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                        modifier = Modifier.weight(1.5f),
                        enabled = name.isNotBlank() && desc.isNotBlank()
                    ) {
                        Text("Suggest")
                    }
                }
            }
        }
    }
}
