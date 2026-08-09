package com.example.ui.main

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Person
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
import com.example.data.EventEntity
import com.example.data.EventRegistrationEntity
import com.example.ui.theme.*

@Composable
fun EventsTabScreen(
    viewModel: MainViewModel,
    currentUserId: String,
    modifier: Modifier = Modifier
) {
    var activeCategory by remember { mutableStateOf("Workshop") } // webinar, workshop, hackathon, buildathon, workation, staycation, debate
    val events by viewModel.eventsFlow.collectAsState(initial = emptyList())
    val registrations by viewModel.repository.getRegistrations(currentUserId).collectAsState(initial = emptyList())
    val context = LocalContext.current

    var selectedEventForPayment by remember { mutableStateOf<EventEntity?>(null) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(SoftOffWhite)
            .testTag("events_tab_screen")
    ) {
        // Horizontally Scrollable Event Categories
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(PureWhite)
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 12.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            val categories = listOf("Workshop", "Webinar", "Hackathon", "Buildathon", "Workation", "Staycation", "Debate")
            categories.forEach { category ->
                val isSelected = activeCategory.equals(category, ignoreCase = true)
                FilterChip(
                    selected = isSelected,
                    onClick = { activeCategory = category },
                    label = { Text(category, fontSize = 12.sp, fontWeight = FontWeight.Bold) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = ForestGreen,
                        selectedLabelColor = PureWhite
                    )
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Selected view filter
        val filteredEvents = events.filter { it.type.equals(activeCategory, ignoreCase = true) }

        if (filteredEvents.isEmpty()) {
            // Empty State
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(64.dp)
                            .background(ForestGreenLight, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("📅", fontSize = 32.sp)
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "No active $activeCategory events",
                        fontWeight = FontWeight.Bold,
                        color = CharcoalHeading,
                        fontSize = 16.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "We are organizing premium buildathons and workations for you. Check back soon!",
                        color = MediumGreyBody,
                        fontSize = 13.sp,
                        textAlign = TextAlign.Center,
                        lineHeight = 18.sp
                    )
                }
            }
        } else {
            // Events list
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, bottom = 96.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Registrations status section if exist
                val pendingRegs = registrations.filter { it.paymentStatus == "Pending Verification" }
                if (pendingRegs.isNotEmpty()) {
                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = ForestGreenLight),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Text("Pending Payment Verification ⏳", fontWeight = FontWeight.Bold, color = ForestGreen, fontSize = 13.sp)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("You have ${pendingRegs.size} pending registrations. Our admin is manually verifying your UPI transaction details. We will notify you once confirmed!", fontSize = 11.sp, color = CharcoalHeading)
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                    }
                }

                items(filteredEvents) { event ->
                    EventCardItem(
                        event = event,
                        isRegistered = registrations.any { it.eventId == event.id },
                        onRegisterClick = { selectedEventForPayment = event }
                    )
                }
            }
        }
    }

    // UPI Payment dialog
    selectedEventForPayment?.let { event ->
        UpiPaymentDialog(
            event = event,
            onDismiss = { selectedEventForPayment = null },
            onSubmitRegistration = { name, email, phone, txnId ->
                viewModel.registerForEvent(event.id, currentUserId, txnId, name, email, phone)
                Toast.makeText(context, "UPI verification request submitted successfully!", Toast.LENGTH_LONG).show()
                selectedEventForPayment = null
            }
        )
    }
}

@Composable
fun EventCardItem(
    event: EventEntity,
    isRegistered: Boolean,
    onRegisterClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = PureWhite),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier
            .fillMaxWidth()
            .shadow(2.dp, RoundedCornerShape(16.dp))
            .border(1.dp, PaleBorder, RoundedCornerShape(16.dp))
            .testTag("event_card_${event.id}")
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
                    Text(event.type.uppercase(), color = ForestGreen, fontSize = 9.sp, fontWeight = FontWeight.Black)
                }

                Text(
                    text = if (event.price == 0) "Free" else "₹${event.price}",
                    color = ForestGreen,
                    fontWeight = FontWeight.Black,
                    fontSize = 16.sp
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = event.title,
                style = MaterialTheme.typography.titleLarge,
                fontSize = 18.sp,
                color = CharcoalHeading,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = event.description,
                color = MediumGreyBody,
                fontSize = 13.sp,
                lineHeight = 18.sp
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Tutor row
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Person, contentDescription = null, tint = ForestGreen, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Tutors: ${event.tutorNames}",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = CharcoalHeading
                )
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Date row
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.CalendarMonth, contentDescription = null, tint = ForestGreen, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Date: ${event.date}",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = CharcoalHeading
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (isRegistered) {
                Button(
                    onClick = {},
                    enabled = false,
                    colors = ButtonDefaults.buttonColors(disabledContainerColor = SoftOffWhite, disabledContentColor = ForestGreen),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Registered (Pending Verification)", fontWeight = FontWeight.Bold)
                }
            } else {
                Button(
                    onClick = onRegisterClick,
                    colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Register Now", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun UpiPaymentDialog(
    event: EventEntity,
    onDismiss: () -> Unit,
    onSubmitRegistration: (String, String, String, String) -> Unit
) {
    val context = LocalContext.current
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var upiTxnId by remember { mutableStateOf("") }

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
                    text = "Confirm Seat: ${event.title} 🎟️",
                    style = MaterialTheme.typography.titleLarge,
                    color = ForestGreen,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "This event requires a one-time entry fee of ₹${event.price}.",
                    fontSize = 12.sp,
                    color = MediumGreyBody
                )

                Spacer(modifier = Modifier.height(16.dp))

                // UPI Details Card
                Card(
                    colors = CardDefaults.cardColors(containerColor = ForestGreenLight),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("1. Manual UPI Payment Details:", fontWeight = FontWeight.Bold, color = ForestGreen, fontSize = 12.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = "UPI ID: ${event.upiId}",
                                fontWeight = FontWeight.ExtraBold,
                                color = CharcoalHeading,
                                fontSize = 13.sp
                            )
                            IconButton(
                                onClick = {
                                    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                    val clip = ClipData.newPlainText("Chavee UPI", event.upiId)
                                    clipboard.setPrimaryClip(clip)
                                    Toast.makeText(context, "UPI ID copied to clipboard!", Toast.LENGTH_SHORT).show()
                                },
                                modifier = Modifier.size(36.dp)
                            ) {
                                Icon(Icons.Default.ContentCopy, contentDescription = "Copy UPI ID", tint = ForestGreen, modifier = Modifier.size(16.dp))
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        // QR Code Placeholder
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(120.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(PureWhite)
                                .border(1.dp, PaleBorder, RoundedCornerShape(8.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("[ STATIC QR CODE PLACEHOLDER ]", fontWeight = FontWeight.Bold, color = MediumGreyBody, fontSize = 11.sp)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("Scan using any UPI App (GPay/PhonePe)", color = MediumGreyBody, fontSize = 9.sp)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text("2. Enter Registration Details:", fontWeight = FontWeight.Bold, color = ForestGreen, fontSize = 12.sp)
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Your Name") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ForestGreen)
                )
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email Address") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ForestGreen)
                )
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("WhatsApp Phone Number") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ForestGreen)
                )
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = upiTxnId,
                    onValueChange = { upiTxnId = it },
                    label = { Text("12-Digit UPI Transaction ID / Ref No.") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = ForestGreen)
                )

                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "*After payment, please enter your transaction ID. Registration status remains pending until admin manual approval.",
                    fontSize = 10.sp,
                    color = MediumGreyBody,
                    lineHeight = 14.sp
                )

                Spacer(modifier = Modifier.height(20.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Button(
                        onClick = onDismiss,
                        colors = ButtonDefaults.buttonColors(containerColor = SoftOffWhite, contentColor = CharcoalHeading),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cancel")
                    }
                    Button(
                        onClick = { onSubmitRegistration(name, email, phone, upiTxnId) },
                        colors = ButtonDefaults.buttonColors(containerColor = ForestGreen),
                        modifier = Modifier.weight(1.5f),
                        enabled = name.isNotBlank() && email.isNotBlank() && phone.isNotBlank() && upiTxnId.isNotBlank()
                    ) {
                        Text("Submit & Register")
                    }
                }
            }
        }
    }
}
