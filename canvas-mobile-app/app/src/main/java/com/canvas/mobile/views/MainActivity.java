package com.canvas.mobile.views;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.PopupWindow;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.canvas.mobile.R;
import com.canvas.mobile.entities.AllowedUser;
import com.canvas.mobile.entities.User;
import com.canvas.mobile.utilities.WhiteboardHelper;
import com.canvas.mobile.entities.Whiteboard;
import com.canvas.mobile.utilities.api.ApiAdapter;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.floatingactionbutton.FloatingActionButton;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MainActivity extends AppCompatActivity {
    private RecyclerView recyclerView;
    private WhiteboardAdapter adapter;
    private String currentUserId;

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
        setContentView(R.layout.activity_main);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Initializes view elements
        recyclerView = findViewById(R.id.whiteboardRecyclerView);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));

        // Gets currently logged in user
        SharedPreferences prefs = getSharedPreferences("PREFERENCES", MODE_PRIVATE);
        currentUserId = prefs.getString("user_id", null);

        // If there is not an user logged in, moves to login screen
        if (currentUserId == null) {
            Intent intent = new Intent(MainActivity.this, LoginActivity.class);
            startActivity(intent);
            finish();
            return;
        }

        // Clears preferences on log out and moves to login screen
        TextView btnLogout = findViewById(R.id.btnLogout);
        btnLogout.setOnClickListener(v -> {
            prefs.edit().clear().apply();
            Intent intent = new Intent(MainActivity.this, LoginActivity.class);
            startActivity(intent);
            overridePendingTransition(R.anim.nav_enter_fade_in, R.anim.nav_exit_slide_down);
            finish();
        });

        // Opens about screen
        TextView btnAbout = findViewById(R.id.btnAbout);
        btnAbout.setOnClickListener(v -> {
            Intent intent = new Intent(MainActivity.this, AboutActivity.class);
            startActivity(intent);
        });

        // Opens create whiteboard dialog
        FloatingActionButton fabAddBoard = findViewById(R.id.fabAddBoard);
        fabAddBoard.setOnClickListener(v -> showCreateWhiteboardDialog());

        // Fetches whiteboards on startup
        loadWhiteboards();
    }

    private void loadWhiteboards() {
        // Fetches whiteboards from server
        WhiteboardHelper.getWhiteboardsByUser(currentUserId, new WhiteboardHelper.WhiteboardListCallback() {
            @Override
            public void onSuccess(List<Whiteboard> whiteboards) {
                // Sets up whiteboards list and adapter
                adapter = new WhiteboardAdapter(whiteboards, new WhiteboardAdapter.OnItemClickListener() {
                    @Override
                    public void onItemClick(Whiteboard whiteboard) {
                        openWebBoard(whiteboard.getId());
                    }

                    @Override
                    public void onShareClick(Whiteboard whiteboard) {
                        shareWhiteboard(whiteboard);
                    }

                    @Override
                    public void onDeleteClick(Whiteboard whiteboard, int position) {
                        confirmAndDelete(whiteboard, position);
                    }
                });

                recyclerView.setAdapter(adapter);
                recyclerView.scheduleLayoutAnimation();
            }

            @Override
            public void onError(String error) {
                // Shows error message if fetch fails
                Toast.makeText(MainActivity.this, getString(R.string.error_network_prefix) + " " + error, Toast.LENGTH_SHORT).show();
                Logger.getLogger("MainActivity").severe(error);
            }
        });
    }

    private void showCreateWhiteboardDialog() {
        View dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_create, null);
        EditText nameInput = dialogView.findViewById(R.id.createBoardNameInput);
        Button btnCancel = dialogView.findViewById(R.id.createCancelBtn);
        Button btnConfirm = dialogView.findViewById(R.id.createConfirmBtn);

        AlertDialog dialog = new MaterialAlertDialogBuilder(this)
                .setView(dialogView)
                .create();
        dialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        dialog.show();

        // Closes dialog on cancel
        btnCancel.setOnClickListener(v -> dialog.dismiss());

        // Handles create confirmation
        btnConfirm.setOnClickListener(v -> {
            String name = nameInput.getText().toString().trim();
            if (name.isEmpty()) {
                nameInput.setError(getString(R.string.error_name_empty));
                return;
            }

            btnConfirm.setText(getString(R.string.create_btn_creating));
            btnConfirm.setEnabled(false);

            Map<String, String> payload = new HashMap<>();
            payload.put("name", name);
            payload.put("ownerId", currentUserId);

            // Calls create API and adds item to list
            ApiAdapter.getApiService().createWhiteboard(payload).enqueue(new Callback<Whiteboard>() {
                @Override
                public void onResponse(Call<Whiteboard> call, Response<Whiteboard> response) {
                    if (response.isSuccessful() && response.body() != null) {
                        dialog.dismiss();
                        if (adapter != null) {
                            adapter.addItem(response.body(), 0);
                            recyclerView.scrollToPosition(0);
                        }
                    } else {
                        btnConfirm.setText(getString(R.string.create_btn_create));
                        btnConfirm.setEnabled(true);
                        Toast.makeText(MainActivity.this, getString(R.string.toast_create_failed), Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(Call<Whiteboard> call, Throwable t) {
                    btnConfirm.setText(getString(R.string.create_btn_create));
                    btnConfirm.setEnabled(true);
                    Toast.makeText(MainActivity.this, getString(R.string.toast_network_error), Toast.LENGTH_SHORT).show();
                }
            });
        });
    }

    private void openWebBoard(String boardId) {
        // Opens whiteboard URL in external web browser
        String url = "https://canvas.fabioamarelle.com/whiteboard/" + boardId + "?id=" + currentUserId;
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        startActivity(intent);
    }

    private void shareWhiteboard(Whiteboard whiteboard) {
        View dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_share, null);
        EditText emailInput = dialogView.findViewById(R.id.shareEmailInput);
        TextView roleSelector = dialogView.findViewById(R.id.shareRoleSelector);
        Button inviteButton = dialogView.findViewById(R.id.shareInviteButton);
        Button copyLinkButton = dialogView.findViewById(R.id.shareCopyLinkButton);
        Button doneButton = dialogView.findViewById(R.id.shareDoneButton);
        ImageButton closeBtn = dialogView.findViewById(R.id.shareCloseBtn);
        LinearLayout collaboratorsContainer = dialogView.findViewById(R.id.shareCollaboratorsContainer);

        final String[] newRoleSelection = {"VIEWER"};

        AlertDialog dialog = new MaterialAlertDialogBuilder(this)
                .setView(dialogView)
                .create();
        dialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        dialog.show();

        // Closes dialog
        closeBtn.setOnClickListener(v -> dialog.dismiss());
        doneButton.setOnClickListener(v -> dialog.dismiss());

        // Handles role selector dropdown popup
        roleSelector.setOnClickListener(v -> {
            View popupView = LayoutInflater.from(this).inflate(R.layout.popup_role, null);
            PopupWindow popupWindow = new PopupWindow(popupView, ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, true);
            popupWindow.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));

            popupView.findViewById(R.id.roleDivider).setVisibility(View.GONE);
            popupView.findViewById(R.id.roleRemove).setVisibility(View.GONE);

            popupView.findViewById(R.id.roleViewer).setOnClickListener(view -> {
                newRoleSelection[0] = "VIEWER";
                roleSelector.setText("VIEWER ▼");
                popupWindow.dismiss();
            });
            popupView.findViewById(R.id.roleEditor).setOnClickListener(view -> {
                newRoleSelection[0] = "EDITOR";
                roleSelector.setText("EDITOR ▼");
                popupWindow.dismiss();
            });

            popupWindow.showAsDropDown(roleSelector, 0, 8);
        });

        // Fetches and displays whiteboard owner
        ApiAdapter.getApiService().getWhiteboardOwner(whiteboard.getId()).enqueue(new Callback<User>() {
            @Override
            public void onResponse(Call<User> call, Response<User> response) {
                if (response.isSuccessful() && response.body() != null) {
                    User owner = response.body();
                    AllowedUser mappedOwner = new AllowedUser();
                    try {
                        java.lang.reflect.Field emailField = AllowedUser.class.getDeclaredField("email");
                        emailField.setAccessible(true);
                        emailField.set(mappedOwner, owner.getEmail());
                    } catch (Exception ignored) {}
                    addCollaboratorToUI(collaboratorsContainer, whiteboard.getId(), mappedOwner, true);
                }
            }
            @Override
            public void onFailure(Call<User> call, Throwable t) {}
        });

        // Fetches and displays existing collaborators
        ApiAdapter.getApiService().getCollaborators(whiteboard.getId()).enqueue(new Callback<List<AllowedUser>>() {
            @Override
            public void onResponse(Call<List<AllowedUser>> call, Response<List<AllowedUser>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    for (AllowedUser user : response.body()) {
                        addCollaboratorToUI(collaboratorsContainer, whiteboard.getId(), user, false);
                    }
                }
            }
            @Override
            public void onFailure(Call<List<AllowedUser>> call, Throwable t) {}
        });

        // Handles new collaborator invitation
        inviteButton.setOnClickListener(v -> {
            String email = emailInput.getText().toString().trim();
            if (email.isEmpty()) return;

            Map<String, String> payload = new HashMap<>();
            payload.put("email", email);
            payload.put("role", newRoleSelection[0]);

            inviteButton.setText(getString(R.string.share_btn_sharing));
            inviteButton.setEnabled(false);

            // Calls add collaborator API
            ApiAdapter.getApiService().addCollaborator(whiteboard.getId(), payload).enqueue(new Callback<AllowedUser>() {
                @Override
                public void onResponse(Call<AllowedUser> call, Response<AllowedUser> response) {
                    inviteButton.setText(getString(R.string.share_btn_share));
                    inviteButton.setEnabled(true);

                    if (response.isSuccessful() && response.body() != null) {
                        addCollaboratorToUI(collaboratorsContainer, whiteboard.getId(), response.body(), false);
                        emailInput.setText("");
                        Toast.makeText(MainActivity.this, getString(R.string.toast_user_added), Toast.LENGTH_SHORT).show();
                    } else {
                        Toast.makeText(MainActivity.this, getString(R.string.toast_user_add_error), Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(Call<AllowedUser> call, Throwable t) {
                    inviteButton.setText(getString(R.string.share_btn_share));
                    inviteButton.setEnabled(true);
                    Toast.makeText(MainActivity.this, getString(R.string.toast_network_error), Toast.LENGTH_SHORT).show();
                }
            });
        });

        // Copies whiteboard link to clipboard
        copyLinkButton.setOnClickListener(v -> {
            String url = "https://canvas.fabioamarelle.com/whiteboard/" + whiteboard.getId();
            ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            ClipData clip = ClipData.newPlainText("Whiteboard Link", url);
            clipboard.setPrimaryClip(clip);
            Toast.makeText(this, getString(R.string.toast_link_copied), Toast.LENGTH_SHORT).show();
        });
    }

    private void addCollaboratorToUI(LinearLayout container, String boardId, AllowedUser user, boolean isOwner) {
        View rowView = LayoutInflater.from(this).inflate(R.layout.item_collaborator, container, false);

        TextView avatarText = rowView.findViewById(R.id.collabAvatarText);
        TextView emailText = rowView.findViewById(R.id.collabEmail);
        TextView roleBtn = rowView.findViewById(R.id.collabRoleBtn);

        String email = user.getEmail() != null ? user.getEmail() : getString(R.string.unknown_email);
        String initial = !email.isEmpty() && !email.equals(getString(R.string.unknown_email)) ? String.valueOf(email.charAt(0)).toUpperCase() : "?";

        avatarText.setText(initial);
        emailText.setText(email);

        // Sets up owner UI specifically
        if (isOwner) {
            roleBtn.setText(getString(R.string.role_owner));
            roleBtn.setTypeface(null, android.graphics.Typeface.ITALIC);
            roleBtn.setClickable(false);
            container.addView(rowView, 0);
        } else {
            // Sets up regular collaborator UI and role dropdown
            String currentRole = user.getPermissionType() != null ? user.getPermissionType() : "VIEWER";
            roleBtn.setText(currentRole + " ▼");

            roleBtn.setOnClickListener(v -> {
                View popupView = LayoutInflater.from(this).inflate(R.layout.popup_role, null);
                PopupWindow popupWindow = new PopupWindow(popupView, ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, true);
                popupWindow.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));

                // Handles role change click
                popupView.findViewById(R.id.roleViewer).setOnClickListener(view -> updateRole(boardId, user, "VIEWER", roleBtn, popupWindow));
                popupView.findViewById(R.id.roleEditor).setOnClickListener(view -> updateRole(boardId, user, "EDITOR", roleBtn, popupWindow));

                // Handles collaborator removal click
                popupView.findViewById(R.id.roleRemove).setOnClickListener(view -> {
                    popupWindow.dismiss();
                    showCustomConfirmDialog(
                            getString(R.string.dialog_remove_collab_title),
                            getString(R.string.dialog_remove_collab_msg, email),
                            getString(R.string.btn_remove),
                            () -> {
                                ApiAdapter.getApiService().removeCollaborator(boardId, user.getId()).enqueue(new Callback<Void>() {
                                    @Override
                                    public void onResponse(Call<Void> call, Response<Void> response) {
                                        if (response.isSuccessful()) container.removeView(rowView);
                                    }
                                    @Override
                                    public void onFailure(Call<Void> call, Throwable t) {}
                                });
                            }
                    );
                });

                popupWindow.showAsDropDown(roleBtn, 0, 8);
            });
            container.addView(rowView);
        }
    }

    private void updateRole(String boardId, AllowedUser user, String newRole, TextView roleBtn, PopupWindow popupWindow) {
        popupWindow.dismiss();
        Map<String, String> payload = new HashMap<>();
        payload.put("role", newRole);

        // Updates collaborator role via API
        ApiAdapter.getApiService().updateCollaboratorRole(boardId, user.getId(), payload).enqueue(new Callback<Void>() {
            @Override
            public void onResponse(Call<Void> call, Response<Void> response) {
                if (response.isSuccessful()) {
                    roleBtn.setText(newRole + " ▼");
                    Toast.makeText(MainActivity.this, getString(R.string.toast_role_updated), Toast.LENGTH_SHORT).show();
                }
            }
            @Override
            public void onFailure(Call<Void> call, Throwable t) {}
        });
    }

    private void confirmAndDelete(Whiteboard whiteboard, int position) {
        // Shows confirmation dialog before deleting whiteboard
        showCustomConfirmDialog(
                getString(R.string.dialog_delete_board_title),
                getString(R.string.dialog_delete_board_msg, whiteboard.getName()),
                getString(R.string.btn_delete),
                () -> {
                    // Calls delete API and removes item from list
                    WhiteboardHelper.deleteWhiteboard(whiteboard.getId(), new WhiteboardHelper.DeleteCallback() {
                        @Override
                        public void onSuccess() {
                            adapter.removeItem(position);
                            Toast.makeText(MainActivity.this, getString(R.string.toast_board_deleted), Toast.LENGTH_SHORT).show();
                        }
                        @Override
                        public void onError(String error) {
                            Toast.makeText(MainActivity.this, getString(R.string.toast_delete_error_prefix) + " " + error, Toast.LENGTH_LONG).show();
                        }
                    });
                }
        );
    }

    private void showCustomConfirmDialog(String titleStr, String messageStr, String confirmStr, Runnable onConfirm) {
        // Inflates and configures custom confirmation dialog
        View dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_confirm, null);
        TextView title = dialogView.findViewById(R.id.dialogTitle);
        TextView message = dialogView.findViewById(R.id.dialogMessage);
        Button btnCancel = dialogView.findViewById(R.id.dialogCancelBtn);
        Button btnConfirm = dialogView.findViewById(R.id.dialogConfirmBtn);

        title.setText(titleStr);
        message.setText(messageStr);
        btnConfirm.setText(confirmStr);
        btnCancel.setText(getString(R.string.btn_cancel));

        AlertDialog dialog = new MaterialAlertDialogBuilder(this)
                .setView(dialogView)
                .create();

        dialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        dialog.show();

        // Closes dialog on cancel
        btnCancel.setOnClickListener(v -> dialog.dismiss());

        // Handles confirmation action
        btnConfirm.setOnClickListener(v -> {
            dialog.dismiss();
            onConfirm.run();
        });
    }
}