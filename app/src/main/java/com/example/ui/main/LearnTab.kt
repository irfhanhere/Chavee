package com.example.ui.main

import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.CourseEntity
import com.example.data.ScholarshipEntity
import com.example.ui.theme.*

@Composable
fun LearnTabScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    var activeSubTab by remember { mutableStateOf(0) } // 0 = Courses, 1 = Scholarships
    val courses by viewModel.coursesFlow.collectAsState(initial = emptyList())
    val scholarships by viewModel.scholarshipsFlow.collectAsState(initial = emptyList())
    val context = LocalContext.current

    var selectedScholarshipDetail by remember { mutableStateOf<ScholarshipEntity?>(null) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(SoftOffWhite)
            .testTag("learn_tab_screen")
    ) {
        // Dual Subtabs at the top
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(PureWhite)
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Button(
                onClick = { activeSubTab = 0 },
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (activeSubTab == 0) ForestGreen else SoftOffWhite,
                    contentColor = if (activeSubTab == 0) PureWhite else MediumGreyBody
                ),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.weight(1f).testTag("courses_subtab_button")
            ) {
                Text("Courses 📚", fontWeight = FontWeight.Bold, fontSize = 14.sp)
            }

            Button(
                onClick = { activeSubTab = 1 },
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (activeSubTab == 1) ForestGreen else SoftOffWhite,
                    contentColor = if (activeSubTab == 1) PureWhite else MediumGreyBody
                ),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.weight(1f).testTag("scholarships_subtab_button")
            ) {
                Text("Scholarships 🎓", fontWeight = FontWeight.Bold, fontSize = 14.sp)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (activeSubTab == 0) {
            // Courses View
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 96.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    Text(
                        text = "Professional Development Courses 🚀",
                        style = MaterialTheme.typography.titleLarge,
                        color = CharcoalHeading,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Register interest to be notified on launch. Certification included!",
                        color = MediumGreyBody,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }

                items(courses) { course ->
                    CourseCardItem(course = course, onNotifyClick = {
                        Toast.makeText(context, "Interest captured for ${course.title}! You will be notified on launch.", Toast.LENGTH_SHORT).show()
                    })
                }
            }
        } else {
            // Scholarships View
            val liveScholarships = scholarships.filter { it.status == "LIVE" }
            val comingSoonScholarships = scholarships.filter { it.status == "COMING_SOON" }

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 96.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    Text(
                        text = "This Month's Active Scholarships 💰",
                        style = MaterialTheme.typography.titleLarge,
                        color = CharcoalHeading,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                }

                items(liveScholarships) { scholarship ->
                    ScholarshipRowItem(scholarship = scholarship, onClick = {
                        selectedScholarshipDetail = scholarship
                    })
                }

                if (comingSoonScholarships.isNotEmpty()) {
                    item {
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Upcoming Scholarships ⏳",
                            style = MaterialTheme.typography.titleLarge,
                            color = CharcoalHeading,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                    }

                    items(comingSoonScholarships) { scholarship ->
                        ComingSoonScholarshipRowItem(scholarship = scholarship)
                    }
                }
            }
        }
    }

    selectedScholarshipDetail?.let { scholarship ->
        ScholarshipDetailDialog(scholarship = scholarship, onDismiss = { selectedScholarshipDetail = null })
    }
}

@Composable
fun CourseCardItem(
    course: CourseEntity,
    onNotifyClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = PureWhite),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier
            .fillMaxWidth()
            .shadow(2.dp, RoundedCornerShape(16.dp))
            .border(1.dp, PaleBorder, RoundedCornerShape(16.dp))
            .testTag("course_card_${course.id}")
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Locked / Coming Soon tag
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .border(1.dp, ForestGreen, RoundedCornerShape(10.dp))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = "Coming Soon",
                        color = ForestGreen,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Black
                    )
                }

                Text(
                    text = "${course.duration} • ${course.level}",
                    fontSize = 11.sp,
                    color = MediumGreyBody,
                    fontWeight = FontWeight.Medium
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = course.title,
                style = MaterialTheme.typography.titleLarge,
                fontSize = 18.sp,
                color = CharcoalHeading,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = course.description,
                color = MediumGreyBody,
                fontSize = 13.sp,
                lineHeight = 18.sp
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Notify Me active CTA button
            Button(
                onClick = onNotifyClick,
                colors = ButtonDefaults.buttonColors(containerColor = SoftOffWhite, contentColor = CharcoalHeading),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(44.dp)
                    .border(1.dp, PaleBorder, RoundedCornerShape(22.dp))
                    .testTag("notify_me_button_${course.id}"),
                shape = RoundedCornerShape(22.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Notifications, contentDescription = null, tint = ForestGreen, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Notify Me", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
            }
        }
    }
}

@Composable
fun ScholarshipRowItem(
    scholarship: ScholarshipEntity,
    onClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = PureWhite),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .shadow(2.dp, RoundedCornerShape(16.dp))
            .border(1.dp, PaleBorder, RoundedCornerShape(16.dp))
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(ForestGreenLight),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "🎓",
                    fontSize = 28.sp
                )
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = scholarship.title,
                    fontWeight = FontWeight.Bold,
                    color = CharcoalHeading,
                    fontSize = 15.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Eligibility: Merit, undergraduate stream",
                    fontSize = 12.sp,
                    color = MediumGreyBody
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Apply by: ${scholarship.deadline}",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFEA4335)
                )
            }
        }
    }
}

@Composable
fun ComingSoonScholarshipRowItem(
    scholarship: ScholarshipEntity
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = SoftOffWhite),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, PaleBorder, RoundedCornerShape(16.dp))
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(PaleBorder),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "🔒",
                    fontSize = 24.sp
                )
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = scholarship.title,
                    fontWeight = FontWeight.SemiBold,
                    color = MediumGreyBody,
                    fontSize = 15.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Eligibility details locked",
                    fontSize = 12.sp,
                    color = MediumGreyBody
                )
                Spacer(modifier = Modifier.height(4.dp))
                Box(
                    modifier = Modifier
                        .background(PaleBorder, RoundedCornerShape(8.dp))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = "Opens soon",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = MediumGreyBody
                    )
                }
            }
        }
    }
}
