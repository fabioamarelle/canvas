package com.canvas.mobile.views;

import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.canvas.mobile.R;

import java.util.Locale;

public class AboutActivity extends AppCompatActivity {

    private int currentLangIndex = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Loads language preferences
        android.content.SharedPreferences langPrefs = getSharedPreferences("Settings", MODE_PRIVATE);
        String language = langPrefs.getString("My_Lang", "en");
        java.util.Locale locale = new java.util.Locale(language);
        java.util.Locale.setDefault(locale);
        android.content.res.Configuration config = new android.content.res.Configuration();
        config.setLocale(locale);
        getResources().updateConfiguration(config, getResources().getDisplayMetrics());

        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_about);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Gets selected language for language change button iteration
        SharedPreferences prefs = getSharedPreferences("Settings", MODE_PRIVATE);
        String currentLang = prefs.getString("My_Lang", "en");
        if (currentLang.equals("es")) currentLangIndex = 1;
        else if (currentLang.equals("ca")) currentLangIndex = 2;
        else currentLangIndex = 0;

        Button btnChangeLanguage = findViewById(R.id.btnChangeLanguage);
        Button btnOpenMap = findViewById(R.id.btnOpenMap);
        TextView btnBack = findViewById(R.id.btnBackFromAbout);

        btnChangeLanguage.setOnClickListener(v -> {
            // Move onto next language
            currentLangIndex = (currentLangIndex + 1) % 3;
            String langCode = (currentLangIndex == 0) ? "en" : (currentLangIndex == 1) ? "es" : "ca";
            setLocalAndRestart(langCode);
        });

        // Go to map activity
        btnOpenMap.setOnClickListener(v -> {
            startActivity(new Intent(AboutActivity.this, MapActivity.class));
        });

        btnBack.setOnClickListener(v -> finish());
    }

    private void setLocalAndRestart(String langCode) {
        // Save language on preferences
        SharedPreferences prefs = getSharedPreferences("Settings", MODE_PRIVATE);
        prefs.edit().putString("My_Lang", langCode).apply();

        // Force Android to use new language
        Locale locale = new Locale(langCode);
        Locale.setDefault(locale);
        Configuration config = new Configuration();
        config.setLocale(locale);
        getResources().updateConfiguration(config, getResources().getDisplayMetrics());

        // Restart app completely
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}