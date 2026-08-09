package com.example.ui.main

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Work
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.GigEntity
import com.example.data.JobEntity
import com.example.ui.theme.*

@Composable
fun EarnTabScreen(
    viewModel: MainViewModel,
    currentUserId: String,
    modifier: Modifier = Modifier
) {
    var activeSubTab by remember { mutableStateOf(0) } // 0 = Jobs, 1 = Marketplace, 2 = Freelance Gigs
    var activeJobFilter by remember { mutableStateOf("All") } // "All", "Full-Time", "Internship", "Part-Time", "Placement Request"

    val jobs by viewModel.jobsFlow.collectAsState(initial = emptyList())
    val gigs by viewModel.gigsFlow.collectAsState(initial = emptyList())
    val context = LocalContext.current

    var selectedJobForDetail by remember { mutableStateOf<JobEntity?>(null) }
    var selectedGigForDetail by remember { mutableStateOf<GigEntity?>(null) }
    var showPlacementRequestForm by remember { mutableStateOf(false) }

    val filteredJobs = if (activeJobFilter == "All") {
        jobs
    } else {
        jobs.filter { it.type.equals(activeJobFilter, ignoreCase = true) }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(SoftOffWhite)
            .testTag("earn_tab_screen")
    ) {
        // Triple Subtabs
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(PureWhite)
                .padding(horizontal = 8.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            val subTabs = listOf("Jobs 💼", "StudySwap 🔄", "Gigs ⚡")
            subTabs.forEachIndexed { index, title ->
                Button(
                    onClick = { activeSubTab = index },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (activeSubTab == index) ForestGreen else SoftOffWhite,
                        contentColor = if (activeSubTab == index) PureWhite else MediumGreyBody
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.weight(1f).testTag("earn_subtab_button_$index")
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
                // JOBS SUB-TAB
                Column(modifier = Modifier.fillMaxSize()) {
                    // Filter Chips Row
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        val filters = listOf("All", "Full-Time", "Internship", "Part-Time")
                        filters.forEach { filter ->
                            FilterChip(
                                selected = activeJobFilter == filter,
                                onClick = { activeJobFilter = filter },
                                label = { Text(filter, fontSize = 11.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = ForestGreen,
                                    selectedLabelColor = PureWhite
                                )
                            )
                        }
                    }

                    // Separate Distinct CTA for Placement Request Assistance Form
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                            .shadow(3.dp, RoundedCornerShape(16.dp))
                            .border(1.5.dp, ForestGreen, RoundedCornerShape(16.dp)),
                        colors = CardDefaults.cardColors(containerColor = ForestGreenLight)
                    ) {
                        Row(
                            modifier = Modifier
                                .padding(16.dp)
                                .fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Placement Assistance 🎓",
                                    color = ForestGreen,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 16.sp
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Submit a personalized placement assistance request to secure active references from Chavee corporate leaders.",
                                    color = CharcoalHeading,
                                    fontSize = 12.sp,
                                    lineHeight = 16.sp
                                )
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Button(
                                onClick = { showPlacementRequestForm = true },
                                colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                                shape = RoundedCornerShape(16.dp)
                            ) {
                                Text("Request", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    // Jobs list
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 96.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(filteredJobs) { job ->
                            JobCardItem(job = job, onClick = { selectedJobForDetail = job })
                        }
                    }
                }
            }
            1 -> {
                // MARKETPLACE SUB-TAB (StudySwap)
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(80.dp)
                            .background(ForestGreenLight, RoundedCornerShape(20.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("🔄", fontSize = 42.sp)
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    Text(
                        text = "StudySwap Marketplace",
                        fontWeight = FontWeight.Black,
                        fontSize = 22.sp,
                        color = CharcoalHeading
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Box(
                        modifier = Modifier
                            .border(1.dp, ForestGreen, RoundedCornerShape(12.dp))
                            .padding(horizontal = 12.dp, vertical = 4.dp)
                    ) {
                        Text("Coming Soon • MVP Stage", color = ForestGreen, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "In the upcoming StudySwap marketplace release, you'll be able to buy, sell, or trade verified lecture notes, revision summaries, exam prep binders, and study materials with college students across India.",
                        color = MediumGreyBody,
                        fontSize = 13.sp,
                        textAlign = TextAlign.Center,
                        lineHeight = 18.sp
                    )
                }
            }
            2 -> {
                // FREELANCE GIGS SUB-TAB
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 96.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Text(
                            text = "Curated Freelance Tasks ⚡",
                            style = MaterialTheme.typography.titleLarge,
                            color = CharcoalHeading,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Complete professional tasks to earn direct pocket cash. Screened by admin.",
                            color = MediumGreyBody,
                            fontSize = 12.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    items(gigs) { gig ->
                        GigCardItem(gig = gig, onClick = { selectedGigForDetail = gig })
                    }
                }
            }
        }
    }

    // Dialog: Placement Assistance Request Form
    if (showPlacementRequestForm) {
        PlacementRequestDialog(
            onSubmit = { name, college, course, year, skills ->
                viewModel.submitPlacementRequest(currentUserId, name, college, course, year, skills)
                Toast.makeText(context, "Placement assistance request submitted! Our career leads will verify your profile.", Toast.LENGTH_LONG).show()
                showPlacementRequestForm = false
            },
            onDismiss = { showPlacementRequestForm = false }
        )
    }

    // Dialog: Job Details
    selectedJobForDetail?.let { job ->
        JobDetailDialog(job = job, onDismiss = { selectedJobForDetail = null })
    }

    // Dialog: Gig Details
    selectedGigForDetail?.let { gig ->
        GigDetailDialog(gig = gig, onDismiss = { selectedGigForDetail = null })
    }
}

@Composable
fun JobCardItem(
    job: JobEntity,
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
                    .size(48.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(ForestGreenLight),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Work, contentDescription = null, tint = ForestGreen)
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(job.title, fontWeight = FontWeight.Bold, color = CharcoalHeading, fontSize = 15.sp)
                Text("${job.company} • ${job.location}", color = MediumGreyBody, fontSize = 12.sp)
                Spacer(modifier = Modifier.height(4.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Box(
                        modifier = Modifier
                            .background(ForestGreenLight, RoundedCornerShape(8.dp))
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text(job.type, color = ForestGreen, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                    Text(job.salary, color = ForestGreen, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

@Composable
fun GigCardItem(
    gig: GigEntity,
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
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .background(ForestGreenLight, RoundedCornerShape(8.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text("ACTIVE TASK", color = ForestGreen, fontSize = 9.sp, fontWeight = FontWeight.Black)
                }

                Text(
                    text = "Earn ₹${gig.price}",
                    color = ForestGreen,
                    fontWeight = FontWeight.Black,
                    fontSize = 15.sp
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text(gig.title, fontWeight = FontWeight.Bold, color = CharcoalHeading, fontSize = 16.sp)
            Spacer(modifier = Modifier.height(4.dp))
            Text(gig.description, color = MediumGreyBody, fontSize = 13.sp, maxLines = 2)

            Spacer(modifier = Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Deadline: ", fontSize = 11.sp, color = MediumGreyBody)
                Text(gig.deadline, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFFEA4335))
            }
        }
    }
}

@Composable
fun PlacementRequestDialog(
    onSubmit: (String, String, String, String, String) -> Unit,
    onDismiss: () -> Unit
) {
    var name by remember { mutableStateOf("") }
    var college by remember { mutableStateOf("") }
    var course by remember { mutableStateOf("") }
    var year by remember { mutableStateOf("") }
    var skills by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = PureWhite),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, PaleBorder, RoundedCornerShape(20.dp))
        ) {
            Column(modifier = Modifier.padding(24.dp)) {
                Text(
                    "Request Placement Assistance 🎓",
                    fontWeight = FontWeight.Black,
                    fontSize = 18.sp,
                    color = ForestGreen
                )
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Full Name") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ForestGreen)
                )
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = college,
                    onValueChange = { college = it },
                    label = { Text("College / University Name") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ForestGreen)
                )
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = course,
                    onValueChange = { course = it },
                    label = { Text("Course / Branch") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ForestGreen)
                )
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = year,
                    onValueChange = { year = it },
                    label = { Text("Graduation Year") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ForestGreen)
                )
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = skills,
                    onValueChange = { skills = it },
                    label = { Text("Core Skills (comma separated)") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ForestGreen)
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
                        onClick = { onSubmit(name, college, course, year, skills) },
                        colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                        modifier = Modifier.weight(1.5f)
                    ) {
                        Text("Submit Request")
                    }
                }
            }
        }
    }
}

@Composable
fun JobDetailDialog(
    job: JobEntity,
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
            Column(modifier = Modifier.padding(24.dp)) {
                Text(job.title, style = MaterialTheme.typography.titleLarge, color = CharcoalHeading, fontWeight = FontWeight.Bold)
                Text("${job.company} • ${job.location}", color = MediumGreyBody, fontSize = 13.sp)

                Spacer(modifier = Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Box(modifier = Modifier.background(ForestGreenLight, RoundedCornerShape(8.dp)).padding(horizontal = 8.dp, vertical = 2.dp)) {
                        Text(job.type, color = ForestGreen, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                    Text(job.salary, color = ForestGreen, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }

                Spacer(modifier = Modifier.height(16.dp))
                Text("ROLE DESCRIPTION:", fontWeight = FontWeight.Bold, fontSize = 11.sp, color = ForestGreen)
                Text(job.description, color = CharcoalHeading, fontSize = 13.sp, lineHeight = 18.sp)

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = {
                        val whatsappIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/919778329167?text=Hello%20Chavee!%20I%20am%20interested%20in%20the%20${job.title}%20job%20listing."))
                        context.startActivity(whatsappIntent)
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                    shape = RoundedCornerShape(24.dp)
                ) {
                    Text("Apply via WhatsApp 💬", color = PureWhite, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun GigDetailDialog(
    gig: GigEntity,
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
            Column(modifier = Modifier.padding(24.dp)) {
                Text(gig.title, style = MaterialTheme.typography.titleLarge, color = CharcoalHeading, fontWeight = FontWeight.Bold)
                Text("Reward: ₹${gig.price}", color = ForestGreen, fontWeight = FontWeight.Black, fontSize = 16.sp)

                Spacer(modifier = Modifier.height(16.dp))
                Text("TASK BRIEF:", fontWeight = FontWeight.Bold, fontSize = 11.sp, color = ForestGreen)
                Text(gig.description, color = CharcoalHeading, fontSize = 13.sp, lineHeight = 18.sp)

                Spacer(modifier = Modifier.height(12.dp))
                Text("DELIVERABLES:", fontWeight = FontWeight.Bold, fontSize = 11.sp, color = ForestGreen)
                Text(gig.deliverables, color = CharcoalHeading, fontSize = 13.sp)

                Spacer(modifier = Modifier.height(12.dp))
                Text("SUBMISSION DEADLINE:", fontWeight = FontWeight.Bold, fontSize = 11.sp, color = Color(0xFFEA4335))
                Text(gig.deadline, color = Color(0xFFEA4335), fontSize = 13.sp, fontWeight = FontWeight.Bold)

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = {
                        val emailIntent = Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:admin@chavee.com?subject=Freelance%20Gig:%20${gig.title}&body=Hi%20Chavee!%20I%20am%20interested%20in%20completing%20the%20freelance%20gig%20task%20brief."))
                        context.startActivity(emailIntent)
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                    shape = RoundedCornerShape(24.dp)
                ) {
                    Text("Apply via Email 📧", color = PureWhite, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
