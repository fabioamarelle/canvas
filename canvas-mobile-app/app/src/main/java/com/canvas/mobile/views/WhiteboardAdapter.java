package com.canvas.mobile.views;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.canvas.mobile.R;
import com.canvas.mobile.entities.Whiteboard;
import com.google.android.material.button.MaterialButton;

import java.util.List;

public class WhiteboardAdapter extends RecyclerView.Adapter<WhiteboardAdapter.ViewHolder> {
    private List<Whiteboard> mData;
    private OnItemClickListener mListener;

    // Interface for handling whiteboard actions
    public interface OnItemClickListener {
        void onItemClick(Whiteboard whiteboard);
        void onShareClick(Whiteboard whiteboard);
        void onDeleteClick(Whiteboard whiteboard, int position);
    }

    public WhiteboardAdapter(List<Whiteboard> data, OnItemClickListener listener) {
        this.mData = data;
        this.mListener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.fragment_whiteboard, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        // Binds data to the views
        Whiteboard board = mData.get(position);
        holder.name.setText(board.getName());

        // Handles whiteboard click
        holder.itemView.setOnClickListener(v -> {
            if (holder.getAdapterPosition() != RecyclerView.NO_POSITION) {
                mListener.onItemClick(board);
            }
        });

        // Handles share button click
        holder.btnShare.setOnClickListener(v -> {
            if (holder.getAdapterPosition() != RecyclerView.NO_POSITION) {
                mListener.onShareClick(board);
            }
        });

        // Handles delete button click
        holder.btnDelete.setOnClickListener(v -> {
            if (holder.getAdapterPosition() != RecyclerView.NO_POSITION) {
                mListener.onDeleteClick(board, holder.getAdapterPosition());
            }
        });
    }

    @Override
    public int getItemCount() { return mData.size(); }

    // Removes item from list
    public void removeItem(int position) {
        if (position >= 0 && position < mData.size()) {
            mData.remove(position);
            notifyItemRemoved(position);
        }
    }

    // Adds item to list, notifies adapter
    public void addItem(Whiteboard board, int position) {
        mData.add(position, board);
        notifyItemInserted(position);
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView name;
        MaterialButton btnShare;
        MaterialButton btnDelete;

        public ViewHolder(View v) {
            super(v);

            // Initializes view elements
            name = v.findViewById(R.id.whiteboardName);
            btnShare = v.findViewById(R.id.shareButton);
            btnDelete = v.findViewById(R.id.deleteButton);
        }
    }
}