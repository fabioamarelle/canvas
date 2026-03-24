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
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_register);

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

            AuthHelper.register(username, email, pass, new AuthHelper.AuthCallback() {
                @Override
                public void onSuccess(User user) {
                    Intent intent = new Intent(RegisterActivity.this, MainActivity.class);
                    startActivity(intent);
                    finish();
                }

                @Override
                public void onError(String error) {
                    android.widget.Toast.makeText(RegisterActivity.this,
                            "Error: " + error, android.widget.Toast.LENGTH_SHORT).show();
                }
            });
        });
        registerActivityLoginButton.setOnClickListener(v -> {
            Intent intent = new Intent(RegisterActivity.this, LoginActivity.class);
            startActivity(intent);
            finish();
        });
    }
}