package com.canvas.mobile.views;

import android.content.Intent;
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

public class RegisterActivity extends AppCompatActivity {
    private TextInputEditText registerActivityUsernameField, registerActivityEmailField, registerActivityPasswordField;
    private Button registerActivityRegisterButton;
    private TextView registerActivityLoginButton;

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
        setContentView(R.layout.activity_register);

        // Initializes view elements
        registerActivityUsernameField = findViewById(R.id.registerActivityUsernameField);
        registerActivityEmailField = findViewById(R.id.registerActivityEmailField);
        registerActivityPasswordField = findViewById(R.id.registerActivityPasswordField);
        registerActivityRegisterButton = findViewById(R.id.registerActivityRegisterButton);
        registerActivityLoginButton = findViewById(R.id.registerActivityLoginButton);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        registerActivityRegisterButton.setOnClickListener(v -> {
            String username = registerActivityUsernameField.getText().toString();
            String email = registerActivityEmailField.getText().toString();
            String pass = registerActivityPasswordField.getText().toString();

            // Call register helper method
            AuthHelper.register(username, email, pass, new AuthHelper.AuthCallback() {
                @Override
                public void onSuccess(User user) {
                    // If register is successful, move onto dashboard
                    Intent intent = new Intent(RegisterActivity.this, MainActivity.class);
                    startActivity(intent);
                    RegisterActivity.this.overridePendingTransition(R.anim.nav_enter_slide_up, R.anim.nav_exit_fade_out);
                    finish();
                }

                @Override
                public void onError(String error) {
                    // If register is not successful, show error message
                    android.widget.Toast.makeText(RegisterActivity.this,
                            getString(R.string.error_prefix) + " " + error, android.widget.Toast.LENGTH_SHORT).show();
                }
            });
        });

        registerActivityLoginButton.setOnClickListener(v -> {
            // Moves to login screen
            Intent intent = new Intent(RegisterActivity.this, LoginActivity.class);
            startActivity(intent);
            overridePendingTransition(R.anim.nav_enter_slide_up, R.anim.nav_exit_fade_out);
            finish();
        });
    }
}