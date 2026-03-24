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
        super.onCreate(savedInstanceState);

        SharedPreferences prefs = getSharedPreferences("PREFERENCES", MODE_PRIVATE);
        String currentUserId = prefs.getString("user_id", null);

        if (currentUserId != null) {
            Intent intent = new Intent(LoginActivity.this, MainActivity.class);
            startActivity(intent);
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

            AuthHelper.login(email, pass, new AuthHelper.AuthCallback() {
                @Override
                public void onSuccess(User user) {
                    SharedPreferences prefs = getSharedPreferences("PREFERENCES", MODE_PRIVATE);
                    prefs.edit()
                            .putString("user_id", user.getId().toString())
                            .putString("username", user.getUsername())
                            .apply();

                    Intent intent = new Intent(LoginActivity.this, MainActivity.class);
                    startActivity(intent);
                    finish();
                }

                @Override
                public void onError(String error) {
                    android.widget.Toast.makeText(LoginActivity.this,
                            "Error: " + error, android.widget.Toast.LENGTH_SHORT).show();
                }
            });
        });

        loginActivityRegisterButton.setOnClickListener(v -> {
            startActivity(new Intent(LoginActivity.this, RegisterActivity.class));
            finish();
        });
    }
}