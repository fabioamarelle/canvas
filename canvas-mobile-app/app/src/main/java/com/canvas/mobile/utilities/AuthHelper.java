package com.canvas.mobile.utilities;

import com.canvas.mobile.utilities.api.ApiAdapter;
import com.canvas.mobile.entities.User;

import java.util.HashMap;
import java.util.Map;

import retrofit2.Call;

public class AuthHelper {
    public interface AuthCallback {
        void onSuccess(User user);
        void onError(String error);
    }

    public static void login(String email, String pass, AuthCallback callback) {
        Map<String, String> fields = new HashMap<>();
        fields.put("email", email);
        fields.put("password", pass);

        ApiAdapter.getApiService().login(fields).enqueue(new retrofit2.Callback<User>() {
            @Override
            public void onResponse(Call<User> call, retrofit2.Response<User> response) {
                if (response.isSuccessful() && response.body() != null) {
                    callback.onSuccess(response.body());
                } else {
                    callback.onError("Login error: " + response.code());
                }
            }

            @Override
            public void onFailure(Call<User> call, Throwable t) {
                callback.onError(t.getMessage());
            }
        });
    }

    public static void register(String username, String email, String pass, AuthCallback callback) {
        Map<String, String> fields = new HashMap<>();
        fields.put("username", username);
        fields.put("email", email);
        fields.put("password", pass);

        ApiAdapter.getApiService().register(fields).enqueue(new retrofit2.Callback<User>() {
            @Override
            public void onResponse(Call<User> call, retrofit2.Response<User> response) {
                if (response.isSuccessful() && response.body() != null) {
                    callback.onSuccess(response.body());
                } else {
                    callback.onError("Register error: " + response.code());
                }
            }

            @Override
            public void onFailure(Call<User> call, Throwable t) {
                callback.onError(t.getMessage());
            }
        });
    }
}
