package com.example.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryGreen,
    secondary = SecondaryGreen,
    tertiary = TertiaryGreen,
    background = CharcoalHeading,
    surface = CharcoalHeading,
    onPrimary = PureWhite,
    onSecondary = PureWhite,
    onBackground = SoftOffWhite,
    onSurface = SoftOffWhite
)

private val LightColorScheme = lightColorScheme(
    primary = PrimaryGreen,
    secondary = SecondaryGreen,
    tertiary = TertiaryGreen,
    background = SoftOffWhite,
    surface = PureWhite,
    onPrimary = PureWhite,
    onSecondary = PureWhite,
    onBackground = CharcoalHeading,
    onSurface = CharcoalHeading,
    surfaceVariant = SurfaceVariantColor,
    onSurfaceVariant = MediumGreyBody,
    outline = PaleBorder
)

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = false, // Enforce light theme by default as per Chavee specifications
    dynamicColor: Boolean = false, // Set to false to preserve exact Chavee brand colors
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
