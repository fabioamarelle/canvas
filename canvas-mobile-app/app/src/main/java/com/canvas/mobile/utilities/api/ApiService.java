package com.canvas.mobile.utilities.api;

import com.canvas.mobile.entities.AllowedUser;
import com.canvas.mobile.entities.User;
import com.canvas.mobile.entities.Whiteboard;

import java.util.List;
import java.util.Map;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Path;

public interface ApiService {
    @POST("auth/login")
    Call<User> login(@Body Map<String, String> credentials);

    @POST("auth/register")
    Call<User> register(@Body Map<String, String> userData);

    @POST("whiteboards")
    Call<Whiteboard> createWhiteboard(@Body Map<String, String> payload);

    @GET("whiteboards/{id}")
    Call<Whiteboard> getWhiteboard(@Path("id") String id);

    @GET("users/{userId}/whiteboards")
    Call<List<Whiteboard>> getWhiteboardsByUser(@Path("userId") String userId);

    @DELETE("whiteboards/{id}")
    Call<Boolean> deleteWhiteboard(@Path("id") String id);

    @GET("whiteboards/{id}/owner")
    Call<User> getWhiteboardOwner(@Path("id") String id);

    @GET("whiteboards/{id}/collaborators")
    Call<List<AllowedUser>> getCollaborators(@Path("id") String id);

    @POST("whiteboards/{id}/collaborators")
    Call<AllowedUser> addCollaborator(@Path("id") String id, @Body Map<String, String> payload);

    @PUT("whiteboards/{id}/collaborators/{userId}")
    Call<Void> updateCollaboratorRole(@Path("id") String id, @Path("userId") String userId, @Body Map<String, String> payload);

    @DELETE("whiteboards/{id}/collaborators/{userId}")
    Call<Void> removeCollaborator(@Path("id") String id, @Path("userId") String userId);
}