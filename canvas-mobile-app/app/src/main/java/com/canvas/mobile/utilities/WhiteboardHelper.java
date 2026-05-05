package com.canvas.mobile.utilities;

import com.canvas.mobile.utilities.api.ApiAdapter;
import com.canvas.mobile.entities.Whiteboard;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class WhiteboardHelper {

    public interface WhiteboardCallback {
        void onSuccess(Whiteboard whiteboard);
        void onError(String error);
    }

    public interface WhiteboardListCallback {
        void onSuccess(List<Whiteboard> whiteboards);
        void onError(String error);
    }

    public interface DeleteCallback {
        void onSuccess();
        void onError(String error);
    }

    public static void getWhiteboard(String id, WhiteboardCallback callback) {
        ApiAdapter.getApiService().getWhiteboard(id).enqueue(new Callback<Whiteboard>() {
            @Override
            public void onResponse(Call<Whiteboard> call, Response<Whiteboard> response) {
                if (response.isSuccessful() && response.body() != null) {
                    callback.onSuccess(response.body());
                } else {
                    callback.onError("Error loading whiteboard: " + response.code());
                }
            }
            @Override
            public void onFailure(Call<Whiteboard> call, Throwable t) {
                callback.onError(t.getMessage());
            }
        });
    }

    public static void getWhiteboardsByUser(String userId, WhiteboardListCallback callback) {
        ApiAdapter.getApiService().getWhiteboardsByUser(userId).enqueue(new Callback<>() {
            @Override
            public void onResponse(Call<List<Whiteboard>> call, Response<List<Whiteboard>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    callback.onSuccess(response.body());
                } else {
                    callback.onError("Error loading whiteboards: " + response.code());
                }
            }
            @Override
            public void onFailure(Call<List<Whiteboard>> call, Throwable t) {
                callback.onError(t.getMessage());
            }
        });
    }

    public static void deleteWhiteboard(String whiteboardId, DeleteCallback callback) {
        ApiAdapter.getApiService().deleteWhiteboard(whiteboardId).enqueue(new Callback<Boolean>() {
            @Override
            public void onResponse(Call<Boolean> call, Response<Boolean> response) {
                if (response.isSuccessful() && response.body() != null && response.body()) {
                    callback.onSuccess();
                } else {
                    callback.onError("Failed to delete whiteboard on server. Code: " + response.code());
                }
            }

            @Override
            public void onFailure(Call<Boolean> call, Throwable t) {
                callback.onError(t.getMessage());
            }
        });
    }
}