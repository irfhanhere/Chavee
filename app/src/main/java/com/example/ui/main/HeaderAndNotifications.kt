package com.example.ui.main

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.*
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
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.example.data.UserEntity
import com.example.ui.theme.*

@Composable
fun ChaveeHeader(
    currentUser: UserEntity?,
    onProfileClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    var showNotifications by remember { mutableStateOf(false) }
    var showMessages by remember { mutableStateOf(false) }

    Surface(
        color = PureWhite,
        tonalElevation = 2.dp,
        modifier = modifier
            .fillMaxWidth()
            .shadow(4.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Top-Left: Circular profile avatar
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .clickable { onProfileClick() }
                    .testTag("top_bar_profile_avatar"),
                contentAlignment = Alignment.Center
            ) {
                if (currentUser != null && currentUser.avatarUrl.isNotEmpty()) {
                    AsyncImage(
                        model = ImageRequest.Builder(LocalContext.current)
                            .data(currentUser.avatarUrl)
                            .crossfade(true)
                            .build(),
                        contentDescription = "Profile",
                        contentScale = ContentScale.Crop,
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
                            text = currentUser?.name?.take(1)?.uppercase() ?: "U",
                            color = ForestGreen,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                    }
                }
            }

            // Top-Center: CHAVEE Wordmark Logo
            Text(
                text = "CHAVEE",
                color = ForestGreen,
                fontWeight = FontWeight.Black,
                fontSize = 24.sp,
                letterSpacing = 1.2.sp,
                modifier = Modifier.testTag("header_logo_wordmark")
            )

            // Top-Right: Notification bell + Message icon
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Notification Bell with Badge
                Box {
                    IconButton(
                        onClick = { showNotifications = true },
                        modifier = Modifier.testTag("header_notification_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Notifications,
                            contentDescription = "Notifications",
                            tint = CharcoalHeading
                        )
                    }
                    // Badge unread count (e.g. 3)
                    Box(
                        modifier = Modifier
                            .size(18.dp)
                            .background(Color(0xFFEA4335), CircleShape)
                            .align(Alignment.TopEnd),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("3", color = PureWhite, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }

                // Message Icon with Badge
                Box {
                    IconButton(
                        onClick = { showMessages = true },
                        modifier = Modifier.testTag("header_messages_button")
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Email,
                            contentDescription = "Messages",
                            tint = CharcoalHeading
                        )
                    }
                    // Badge unread count (e.g. 1)
                    Box(
                        modifier = Modifier
                            .size(18.dp)
                            .background(ForestGreen, CircleShape)
                            .align(Alignment.TopEnd),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("1", color = PureWhite, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    if (showNotifications) {
        NotificationCenterDialog(onDismiss = { showNotifications = false })
    }

    if (showMessages) {
        DirectMessagesDialog(currentUser = currentUser, onDismiss = { showMessages = false })
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationCenterDialog(onDismiss: () -> Unit) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text("Notifications 🔔", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = CharcoalHeading) },
                    navigationIcon = {
                        IconButton(onClick = onDismiss) {
                            Icon(Icons.Outlined.Close, contentDescription = "Close", tint = CharcoalHeading)
                        }
                    },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = PureWhite)
                )
            },
            containerColor = SoftOffWhite
        ) { innerPadding ->
            val notifications = listOf(
                NotificationItem("Today", "Congratulations! Your seat for the Korean Language Workshop has been confirmed.", "10 mins ago", true),
                NotificationItem("Today", "Priya Patel started following you.", "2 hrs ago", false),
                NotificationItem("Earlier", "Reminder: Reliance Foundation Scholarship application deadline is August 31st.", "1 day ago", false),
                NotificationItem("Earlier", "New job posted: Junior Android Developer at TechVantage Solutions.", "2 days ago", false),
                NotificationItem("Earlier", "Admin: Welcome to Chavee! Complete your student profile to claim your 'Early Adopter' badge.", "3 days ago", true)
            )

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Group by Today vs Earlier
                val grouped = notifications.groupBy { it.group }
                grouped.forEach { (group, items) ->
                    item {
                        Text(
                            text = group,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = ForestGreen,
                            modifier = Modifier.padding(vertical = 8.dp)
                        )
                    }
                    items(items) { item ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = PureWhite),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .shadow(2.dp, RoundedCornerShape(12.dp))
                        ) {
                            Row(
                                modifier = Modifier
                                    .padding(16.dp)
                                    .fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(10.dp)
                                        .background(if (item.isUnread) ForestGreen else Color.Transparent, CircleShape)
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = item.content,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = CharcoalHeading,
                                        fontWeight = if (item.isUnread) FontWeight.SemiBold else FontWeight.Normal
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = item.time,
                                        fontSize = 11.sp,
                                        color = MediumGreyBody
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

data class NotificationItem(
    val group: String,
    val content: String,
    val time: String,
    val isUnread: Boolean
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DirectMessagesDialog(currentUser: UserEntity?, onDismiss: () -> Unit) {
    var activeChatPartner by remember { mutableStateOf<String?>(null) } // "Chavee Team" or "Priya Patel"

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = {
                        Text(
                            text = activeChatPartner ?: "Direct Messages 💬",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp,
                            color = CharcoalHeading
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = {
                            if (activeChatPartner != null) {
                                activeChatPartner = null
                            } else {
                                onDismiss()
                            }
                        }) {
                            Icon(Icons.Outlined.Close, contentDescription = "Back", tint = CharcoalHeading)
                        }
                    },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = PureWhite)
                )
            },
            containerColor = SoftOffWhite
        ) { innerPadding ->
            if (activeChatPartner == null) {
                // Chat List
                val chats = listOf(
                    ChatListItem("Chavee Team", "Hi! Your Korean language payment is being verified. Please stay tuned.", "1 hr ago", "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120", 1),
                    ChatListItem("Priya Patel", "Awesome Aarav, let's join the StudySwap room later!", "Yesterday", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120", 0)
                )

                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(chats) { chat ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = PureWhite),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { activeChatPartner = chat.name }
                                .shadow(2.dp, RoundedCornerShape(12.dp))
                        ) {
                            Row(
                                modifier = Modifier
                                    .padding(16.dp)
                                    .fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                AsyncImage(
                                    model = ImageRequest.Builder(LocalContext.current)
                                        .data(chat.avatarUrl)
                                        .crossfade(true)
                                        .build(),
                                    contentDescription = null,
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(CircleShape)
                                )
                                Spacer(modifier = Modifier.width(16.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(chat.name, fontWeight = FontWeight.Bold, color = CharcoalHeading, fontSize = 14.sp)
                                        Text(chat.time, fontSize = 11.sp, color = MediumGreyBody)
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = chat.lastMessage,
                                        fontSize = 13.sp,
                                        color = if (chat.unreadCount > 0) CharcoalHeading else MediumGreyBody,
                                        fontWeight = if (chat.unreadCount > 0) FontWeight.SemiBold else FontWeight.Normal,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                                if (chat.unreadCount > 0) {
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Box(
                                        modifier = Modifier
                                            .size(20.dp)
                                            .background(ForestGreen, CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            chat.unreadCount.toString(),
                                            color = PureWhite,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                // Active Chat Conversation Screen
                val initialMessages = if (activeChatPartner == "Chavee Team") {
                    mutableListOf(
                        ChatMessage("Hello!", false),
                        ChatMessage("Welcome to Chavee Student Hub. How can we assist you today?", false),
                        ChatMessage("I registered for the Korean Language workshop and submitted my UPI transaction id.", true),
                        ChatMessage("Excellent! We have received your submission. Your payment details are currently under manual admin verification. You will be notified shortly.", false)
                    )
                } else {
                    mutableListOf(
                        ChatMessage("Hi Aarav! Are you planning to apply for the Reliance Scholarship?", false),
                        ChatMessage("Yes Priya, I am writing the statement essays right now.", true),
                        ChatMessage("Awesome Aarav, let's join the StudySwap room later!", false)
                    )
                }

                val messages = remember { mutableStateListOf<ChatMessage>().apply { addAll(initialMessages) } }
                var textInput by remember { mutableStateOf("") }

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                ) {
                    // Message List
                    LazyColumn(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(messages) { message ->
                            val alignment = if (message.isMe) Alignment.End else Alignment.Start
                            val color = if (message.isMe) ForestGreen else PureWhite
                            val textColor = if (message.isMe) PureWhite else CharcoalHeading
                            val borderMod = if (message.isMe) Modifier else Modifier.border(1.dp, PaleBorder, RoundedCornerShape(12.dp))

                            Box(
                                modifier = Modifier.fillMaxWidth(),
                                contentAlignment = if (message.isMe) Alignment.CenterEnd else Alignment.CenterStart
                            ) {
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = color),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = borderMod
                                        .widthIn(max = 280.dp)
                                        .shadow(1.dp, RoundedCornerShape(12.dp))
                                ) {
                                    Text(
                                        text = message.text,
                                        color = textColor,
                                        modifier = Modifier.padding(12.dp),
                                        fontSize = 14.sp
                                    )
                                }
                            }
                        }
                    }

                    // Input Row
                    Surface(
                        color = PureWhite,
                        tonalElevation = 4.dp,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp)
                                .navigationBarsPadding(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedTextField(
                                value = textInput,
                                onValueChange = { textInput = it },
                                placeholder = { Text("Write your message...") },
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = ForestGreen,
                                    unfocusedBorderColor = PaleBorder
                                ),
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(end = 12.dp),
                                shape = RoundedCornerShape(24.dp)
                            )
                            IconButton(
                                onClick = {
                                    if (textInput.isNotBlank()) {
                                        messages.add(ChatMessage(textInput, true))
                                        textInput = ""
                                    }
                                },
                                modifier = Modifier
                                    .size(48.dp)
                                    .background(ForestGreen, CircleShape)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Send,
                                    contentDescription = "Send",
                                    tint = PureWhite
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

data class ChatListItem(
    val name: String,
    val lastMessage: String,
    val time: String,
    val avatarUrl: String,
    val unreadCount: Int
)

data class ChatMessage(
    val text: String,
    val isMe: Boolean
)
