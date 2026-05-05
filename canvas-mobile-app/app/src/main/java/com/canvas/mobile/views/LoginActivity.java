package com.canvas.mobile.views;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.canvas.mobile.R;
import com.canvas.mobile.utilities.AuthHelper;
import com.canvas.mobile.entities.User;
import com.google.android.material.textfield.TextInputEditText;

public class LoginActivity extends AppCompatActivity {

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

        // Gets currently logged in user, if exists
        SharedPreferences prefs = getSharedPreferences("PREFERENCES", MODE_PRIVATE);
        String currentUserId = prefs.getString("user_id", null);

        // If there is an user logged in, skip login screen
        if (currentUserId != null) {
            Intent intent = new Intent(LoginActivity.this, MainActivity.class);
            startActivity(intent);
            overridePendingTransition(R.anim.nav_enter_slide_up, R.anim.nav_exit_fade_out);
            finish();
            return;
        }

        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_login);

        TextInputEditText loginActivityEmailField = findViewById(R.id.loginActivityUsernameField);
        TextInputEditText loginActivityPasswordField = findViewById(R.id.loginActivityPasswordField);
        Button loginActivityLoginButton = findViewById(R.id.loginActivityLoginButton);
        TextView loginActivityRegisterButton = findViewById(R.id.loginActivityRegisterButton);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        loginActivityLoginButton.setOnClickListener(v -> {
            String email = loginActivityEmailField.getText().toString();
            String pass = loginActivityPasswordField.getText().toString();

            // Call login helper method
            AuthHelper.login(email, pass, new AuthHelper.AuthCallback() {
                @Override
                public void onSuccess(User user) {
                    // If login is successful, save information to preferences, move onto dashboard
                    SharedPreferences prefs = getSharedPreferences("PREFERENCES", MODE_PRIVATE);
                    prefs.edit()
                            .putString("user_id", user.getId().toString())
                            .putString("username", user.getUsername())
                            .apply();

                    Intent intent = new Intent(LoginActivity.this, MainActivity.class);
                    startActivity(intent);
                    LoginActivity.this.overridePendingTransition(R.anim.nav_enter_slide_up, R.anim.nav_exit_fade_out);
                    finish();
                }

                @Override
                public void onError(String error) {
                    // If login is not successful, show error message
                    android.widget.Toast.makeText(LoginActivity.this,
                            getString(R.string.error_prefix) + " " + error, android.widget.Toast.LENGTH_SHORT).show();
                }
            });
        });

        loginActivityRegisterButton.setOnClickListener(v -> {
            // Moves to register screen
            startActivity(new Intent(LoginActivity.this, RegisterActivity.class));
            overridePendingTransition(R.anim.nav_enter_slide_up, R.anim.nav_exit_fade_out);
            finish();
        });
    }
}