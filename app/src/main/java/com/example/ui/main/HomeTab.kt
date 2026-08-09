package com.example.ui.main

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.outlined.Comment
import androidx.compose.material.icons.outlined.Share
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
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.example.data.PlatformStatEntity
import com.example.data.PostEntity
import com.example.data.ScholarshipEntity
import com.example.ui.theme.*
import kotlinx.coroutines.flow.Flow

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeTabScreen(
    viewModel: MainViewModel,
    currentUserId: String,
    onNavigateToScholarships: () -> Unit,
    modifier: Modifier = Modifier
) {
    val searchQuery by viewModel.searchQuery.collectAsState()
    val featuredPost by viewModel.featuredPostFlow.collectAsState(initial = null)
    val stats by viewModel.statsFlow.collectAsState(initial = emptyList())
    val posts by viewModel.postsFlow.collectAsState(initial = emptyList())
    val scholarships by viewModel.scholarshipsFlow.collectAsState(initial = emptyList())
    val jobs by viewModel.jobsFlow.collectAsState(initial = emptyList())
    val courses by viewModel.coursesFlow.collectAsState(initial = emptyList())

    // UI Dialog selectors for details
    var selectedScholarshipAd by remember { mutableStateOf<ScholarshipEntity?>(null) }
    var activePostComments by remember { mutableStateOf<PostEntity?>(null) }

    val filteredPosts = posts.filter {
        it.content.contains(searchQuery, ignoreCase = true) ||
                it.authorName.contains(searchQuery, ignoreCase = true)
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(SoftOffWhite)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Main content scroller
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .testTag("home_scrollable_list"),
                contentPadding = PaddingValues(bottom = 96.dp)
            ) {
                // 1. Search Bar
                item {
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { viewModel.setSearchQuery(it) },
                        placeholder = { Text("Search jobs, courses, scholarships, events, peer posts...", fontSize = 13.sp) },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = ForestGreen) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp)
                            .testTag("global_search_bar"),
                        shape = RoundedCornerShape(24.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = PureWhite,
                            unfocusedContainerColor = PureWhite,
                            focusedBorderColor = ForestGreen,
                            unfocusedBorderColor = PaleBorder
                        ),
                        singleLine = true
                    )
                }

                // Search Overlay results
                if (searchQuery.isNotBlank()) {
                    item {
                        Text(
                            text = "Search Results for '$searchQuery'",
                            fontWeight = FontWeight.Bold,
                            color = ForestGreen,
                            fontSize = 15.sp,
                            modifier = Modifier.padding(16.dp)
                        )
                    }

                    val filteredScholarships = scholarships.filter { it.title.contains(searchQuery, ignoreCase = true) }
                    val filteredJobs = jobs.filter { it.title.contains(searchQuery, ignoreCase = true) || it.company.contains(searchQuery, ignoreCase = true) }
                    val filteredCourses = courses.filter { it.title.contains(searchQuery, ignoreCase = true) }

                    if (filteredScholarships.isEmpty() && filteredJobs.isEmpty() && filteredCourses.isEmpty() && filteredPosts.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("No matches found. Try general keywords!", color = MediumGreyBody, textAlign = TextAlign.Center)
                            }
                        }
                    }

                    items(filteredScholarships) { item ->
                        SearchItemRow("🎓 Scholarship", item.title, "Deadline: ${item.deadline}") {
                            selectedScholarshipAd = item
                        }
                    }

                    items(filteredJobs) { item ->
                        SearchItemRow("💼 Career Option", "${item.title} at ${item.company}", "Type: ${item.type}") {
                            // Can select or direct
                        }
                    }

                    items(filteredCourses) { item ->
                        SearchItemRow("📚 Course", item.title, "Duration: ${item.duration}") {
                            // Detail
                        }
                    }
                }

                // Standard Dashboard Layout
                if (searchQuery.isBlank()) {
                    // 2. Post of the Day
                    featuredPost?.let { featured ->
                        item {
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = "Post of the Day 🏆",
                                color = ForestGreen,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                modifier = Modifier.padding(horizontal = 16.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            PostCardItem(
                                post = featured,
                                currentUserId = currentUserId,
                                hasLikedFlow = viewModel.repository.hasLikedPost(featured.id, currentUserId),
                                onLikeClick = { viewModel.toggleLike(featured.id, currentUserId, it) },
                                onCommentClick = { activePostComments = featured },
                                isFeatured = true
                            )
                        }
                    }

                    // 3. Top Scholarship Ad
                    scholarships.find { it.isTopBanner }?.let { bannerScholarship ->
                        item {
                            Spacer(modifier = Modifier.height(20.dp))
                            Text(
                                text = "Scholarship of the Month 💰",
                                color = ForestGreen,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                modifier = Modifier.padding(horizontal = 16.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            ScholarshipBannerCard(
                                scholarship = bannerScholarship,
                                onClick = { selectedScholarshipAd = bannerScholarship }
                            )
                        }
                    }

                    // 4. Today's Highlights (Live statistics metrics row)
                    item {
                        Spacer(modifier = Modifier.height(20.dp))
                        Text(
                            text = "Today's Highlights ⚡",
                            color = ForestGreen,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            modifier = Modifier.padding(horizontal = 16.dp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        TodayHighlightsStrip(stats = stats)
                    }

                    // 5. Featured / Coming Soon section (Study Sync, StudySwap, Mentorship Program)
                    item {
                        Spacer(modifier = Modifier.height(20.dp))
                        Text(
                            text = "Featured Releases 🚀",
                            color = ForestGreen,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            modifier = Modifier.padding(horizontal = 16.dp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        ComingSoonCarousel()
                    }

                    // 6. Main Feed
                    item {
                        Spacer(modifier = Modifier.height(24.dp))
                        Text(
                            text = "Student Community Buzz 💬",
                            color = ForestGreen,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            modifier = Modifier.padding(horizontal = 16.dp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    items(filteredPosts.filter { !it.isFeatured }) { post ->
                        PostCardItem(
                            post = post,
                            currentUserId = currentUserId,
                            hasLikedFlow = viewModel.repository.hasLikedPost(post.id, currentUserId),
                            onLikeClick = { viewModel.toggleLike(post.id, currentUserId, it) },
                            onCommentClick = { activePostComments = post }
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                    }
                }
            }
        }
    }

    // Detail Dialogs
    selectedScholarshipAd?.let { scholarship ->
        ScholarshipDetailDialog(scholarship = scholarship, onDismiss = { selectedScholarshipAd = null })
    }

    activePostComments?.let { post ->
        PostCommentsDialog(
            post = post,
            viewModel = viewModel,
            currentUserId = currentUserId,
            onDismiss = { activePostComments = null }
        )
    }
}

@Composable
fun SearchItemRow(
    type: String,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .clickable { onClick() }
            .border(1.dp, PaleBorder, RoundedCornerShape(12.dp)),
        colors = CardDefaults.cardColors(containerColor = PureWhite),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(type, color = ForestGreen, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(2.dp))
                Text(title, color = CharcoalHeading, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(subtitle, color = MediumGreyBody, fontSize = 12.sp)
            }
        }
    }
}

@Composable
fun PostCardItem(
    post: PostEntity,
    currentUserId: String,
    hasLikedFlow: Flow<Boolean>,
    onLikeClick: (Boolean) -> Unit,
    onCommentClick: () -> Unit,
    isFeatured: Boolean = false
) {
    val context = LocalContext.current
    val hasLiked by hasLikedFlow.collectAsState(initial = false)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .shadow(if (isFeatured) 6.dp else 2.dp, RoundedCornerShape(16.dp))
            .border(
                width = if (isFeatured) 1.5.dp else 1.dp,
                color = if (isFeatured) ForestGreen else PaleBorder,
                shape = RoundedCornerShape(16.dp)
            )
            .testTag("post_card_${post.id}"),
        colors = CardDefaults.cardColors(containerColor = PureWhite),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header: User avatar + name + status
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                AsyncImage(
                    model = ImageRequest.Builder(context)
                        .data(post.authorAvatar)
                        .crossfade(true)
                        .build(),
                    contentDescription = null,
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = post.authorName,
                            fontWeight = FontWeight.Bold,
                            color = CharcoalHeading,
                            fontSize = 14.sp
                        )
                        if (isFeatured) {
                            Spacer(modifier = Modifier.width(8.dp))
                            Box(
                                modifier = Modifier
                                    .background(ForestGreenLight, RoundedCornerShape(8.dp))
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text("FEATURED", color = ForestGreen, fontSize = 9.sp, fontWeight = FontWeight.Black)
                            }
                        }
                    }
                    Text(
                        text = "Student • Verified",
                        color = MediumGreyBody,
                        fontSize = 11.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Body text
            Text(
                text = post.content,
                style = MaterialTheme.typography.bodyLarge,
                fontSize = 14.sp,
                color = CharcoalHeading,
                lineHeight = 20.sp
            )

            // Optional Image Attachment
            if (post.mediaUrl.isNotEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                AsyncImage(
                    model = ImageRequest.Builder(context)
                        .data(post.mediaUrl)
                        .crossfade(true)
                        .build(),
                    contentDescription = "Attachment",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .border(1.dp, PaleBorder, RoundedCornerShape(12.dp))
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Interaction Bar (Like, Comment, Share)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Like Button
                Row(
                    modifier = Modifier
                        .clickable { onLikeClick(hasLiked) }
                        .padding(vertical = 4.dp, horizontal = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = if (hasLiked) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                        contentDescription = "Like",
                        tint = if (hasLiked) Color(0xFFEA4335) else MediumGreyBody,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "${post.likeCount}",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (hasLiked) Color(0xFFEA4335) else MediumGreyBody
                    )
                }

                // Comment Button
                Row(
                    modifier = Modifier
                        .clickable { onCommentClick() }
                        .padding(vertical = 4.dp, horizontal = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Comment,
                        contentDescription = "Comment",
                        tint = MediumGreyBody,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "${post.commentCount}",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MediumGreyBody
                    )
                }

                // Share Button
                Row(
                    modifier = Modifier
                        .clickable {
                            // Demo share click trigger
                        }
                        .padding(vertical = 4.dp, horizontal = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Share,
                        contentDescription = "Share",
                        tint = MediumGreyBody,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Share",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MediumGreyBody
                    )
                }
            }
        }
    }
}

@Composable
fun ScholarshipBannerCard(
    scholarship: ScholarshipEntity,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .clickable { onClick() }
            .shadow(4.dp, RoundedCornerShape(16.dp))
            .border(1.5.dp, ForestGreen, RoundedCornerShape(16.dp))
            .testTag("featured_scholarship_card"),
        colors = CardDefaults.cardColors(containerColor = ForestGreen),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Box(
                    modifier = Modifier
                        .background(PureWhite.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text("FEATURED SCHOLARSHIP 🎓", color = PureWhite, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = scholarship.title,
                    color = PureWhite,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 18.sp,
                    maxLines = 2,
                    lineHeight = 22.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Grant value: Up to ₹2 Lakhs per year. Apply now!",
                    color = PureWhite.copy(alpha = 0.9f),
                    fontSize = 12.sp
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "Deadline: ${scholarship.deadline} • Tap to view details",
                    color = PureWhite.copy(alpha = 0.8f),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}

@Composable
fun TodayHighlightsStrip(
    stats: List<PlatformStatEntity>
) {
    LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        items(stats) { stat ->
            Card(
                colors = CardDefaults.cardColors(containerColor = PureWhite),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .width(180.dp)
                    .border(1.dp, PaleBorder, RoundedCornerShape(12.dp))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = stat.metricValue,
                        color = ForestGreen,
                        fontWeight = FontWeight.Black,
                        fontSize = 18.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = stat.metricName,
                        color = MediumGreyBody,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}

@Composable
fun ComingSoonCarousel() {
    val items = listOf(
        ComingSoonItem("Study Sync", "Sync study timelines with college teammates dynamically.", "July 2026"),
        ComingSoonItem("StudySwap", "Buy, sell, or trade verified exam prep notes locally.", "August 2026"),
        ComingSoonItem("Mentorship Program", "Secure personal career roadmaps from industry leaders.", "September 2026")
    )

    LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        items(items) { item ->
            Box(
                modifier = Modifier
                    .width(220.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(PureWhite)
                    .border(1.dp, PaleBorder, RoundedCornerShape(16.dp))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    // Outlined Coming Soon Badge
                    Box(
                        modifier = Modifier
                            .border(1.dp, ForestGreen, RoundedCornerShape(10.dp))
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "Coming Soon",
                            color = ForestGreen,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = item.title,
                        fontWeight = FontWeight.Bold,
                        color = CharcoalHeading,
                        fontSize = 15.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = item.description,
                        color = MediumGreyBody,
                        fontSize = 12.sp,
                        lineHeight = 16.sp,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )

                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "ETA: ${item.eta}",
                        color = ForestGreen,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 11.sp
                    )
                }
            }
        }
    }
}

data class ComingSoonItem(
    val title: String,
    val description: String,
    val eta: String
)

@Composable
fun ScholarshipDetailDialog(
    scholarship: ScholarshipEntity,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = PureWhite),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, PaleBorder, RoundedCornerShape(20.dp))
        ) {
            Column(
                modifier = Modifier
                    .padding(24.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Scholarship Info 🎓", fontWeight = FontWeight.Black, fontSize = 16.sp, color = ForestGreen)
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Share, contentDescription = "Close", tint = MediumGreyBody)
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
                Text(scholarship.title, style = MaterialTheme.typography.headlineMedium, fontSize = 20.sp, color = CharcoalHeading, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(12.dp))

                Text("ELIGIBILITY CRITERIA:", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = ForestGreen)
                Text(scholarship.eligibility, color = CharcoalHeading, fontSize = 13.sp)
                Spacer(modifier = Modifier.height(12.dp))

                Text("DESCRIPTION:", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = ForestGreen)
                Text(scholarship.description, color = CharcoalHeading, fontSize = 13.sp, lineHeight = 18.sp)
                Spacer(modifier = Modifier.height(16.dp))

                Text("DEADLINE: ${scholarship.deadline}", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color(0xFFEA4335))

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = {
                        val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(scholarship.applyUrl))
                        context.startActivity(intent)
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                    shape = RoundedCornerShape(24.dp)
                ) {
                    Text("Apply Now (External Site)", color = PureWhite, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun PostCommentsDialog(
    post: PostEntity,
    viewModel: MainViewModel,
    currentUserId: String,
    onDismiss: () -> Unit
) {
    val comments by viewModel.getCommentsForPost(post.id).collectAsState(initial = emptyList())
    var textInput by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = PureWhite),
            modifier = Modifier
                .fillMaxWidth()
                .height(450.dp)
                .border(1.dp, PaleBorder, RoundedCornerShape(20.dp))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                Text(
                    text = "Comments (${comments.size})",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = ForestGreen,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(comments) { comment ->
                        Row(verticalAlignment = Alignment.Top) {
                            AsyncImage(
                                model = ImageRequest.Builder(LocalContext.current)
                                    .data(comment.userAvatar)
                                    .crossfade(true)
                                    .build(),
                                contentDescription = null,
                                modifier = Modifier
                                    .size(28.dp)
                                    .clip(CircleShape)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Card(
                                colors = CardDefaults.cardColors(containerColor = SoftOffWhite),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Column(modifier = Modifier.padding(8.dp)) {
                                    Text(comment.userName, fontWeight = FontWeight.Bold, fontSize = 11.sp, color = CharcoalHeading)
                                    Text(comment.commentText, fontSize = 12.sp, color = CharcoalHeading)
                                }
                            }
                        }
                    }
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = textInput,
                        onValueChange = { textInput = it },
                        placeholder = { Text("Write a comment...", fontSize = 12.sp) },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(16.dp),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ForestGreen)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            viewModel.submitComment(post.id, currentUserId, "Aarav Sharma", "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120", textInput)
                            textInput = ""
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Post", fontSize = 12.sp)
                    }
                }
            }
        }
    }
}
