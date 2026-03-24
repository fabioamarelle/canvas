package com.canvas.mobile.views;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.recyclerview.widget.RecyclerView;

import com.canvas.mobile.R;
import com.canvas.mobile.entities.Whiteboard;
import com.google.android.material.button.MaterialButton;

import java.util.List;

public class WhiteboardAdapter extends RecyclerView.Adapter<WhiteboardAdapter.ViewHolder> {
    private List<Whiteboard> mData;
    private OnItemClickListener mListener;

    public interface OnItemClickListener {
        void onItemClick(Whiteboard whiteboard);
    }

    public WhiteboardAdapter(List<Whiteboard> data, OnItemClickListener listener) {
        this.mData = data;
        this.mListener = listener;
    }

    @Override
    public ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.fragment_whiteboard, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(ViewHolder holder, int position) {
        Whiteboard board = mData.get(position);
        holder.name.setText(board.getName());

        holder.itemView.setOnClickListener(v -> mListener.onItemClick(board));

        // TODO: setOnClickListener
    }

    @Override
    public int getItemCount() { return mData.size(); }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView name;
        MaterialButton btnShare;
        MaterialButton btnDelete;

        public ViewHolder(View v) {
            super(v);
            name = v.findViewById(R.id.whiteboardName);
            btnShare = v.findViewById(R.id.imageButton7);
            btnDelete = v.findViewById(R.id.imageButton8);
        }
    }
}