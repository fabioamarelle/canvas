package com.canvas.mobile.views;

import android.os.Bundle;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.canvas.mobile.R;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MarkerOptions;

public class MapActivity extends AppCompatActivity implements OnMapReadyCallback {

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
        setContentView(R.layout.activity_map);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        TextView btnBack = findViewById(R.id.btnBackFromMap);

        // Goes back to previous screen
        btnBack.setOnClickListener(v -> finish());

        // Sets up map fragment
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.map);
        if (mapFragment != null) {
            mapFragment.getMapAsync(this);
        }
    }

    @Override
    public void onMapReady(GoogleMap googleMap) {
        // Defines coordinates
        LatLng institutJaumeHuguet = new LatLng(41.289478, 1.246083);

        // Adds customized marker
        com.google.android.gms.maps.model.Marker marker = googleMap.addMarker(new MarkerOptions()
                .position(institutJaumeHuguet)
                .title("Institut Jaume Huguet")
                .snippet("Lloc de desenvolupament del projecte")
                .icon(com.google.android.gms.maps.model.BitmapDescriptorFactory.defaultMarker(com.google.android.gms.maps.model.BitmapDescriptorFactory.HUE_AZURE))

        if (marker != null) {
            marker.showInfoWindow();
        }

        // Moves and zooms camera to marker
        googleMap.moveCamera(CameraUpdateFactory.newLatLngZoom(institutJaumeHuguet, 16f));
    }
}