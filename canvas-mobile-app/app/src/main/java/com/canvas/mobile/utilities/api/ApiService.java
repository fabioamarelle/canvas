package com.canvas.mobile.utilities.api;

import com.canvas.mobile.entities.User;
import com.canvas.mobile.entities.Whiteboard;

import java.util.List;
import java.util.Map;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.Path;

public interface ApiService {
    @POST("auth/login")
    Call<User> login(@Body Map<String, String> credentials);

    @POST("auth/register")
    Call<User> register(@Body Map<String, String> userData);

    @GET("whiteboards/{id}")
    Call<Whiteboard> getWhiteboard(@Path("id") String id);

    @GET("users/{userId}/whiteboards")
    Call<List<Whiteboard>> getWhiteboardsByUser(@Path("userId") String userId);
}