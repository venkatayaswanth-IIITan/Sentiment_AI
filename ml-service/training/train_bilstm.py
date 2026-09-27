"""
Bidirectional LSTM (BiLSTM) with Attention mechanism for sentiment analysis.
"""
import os
import torch
import torch.nn as nn
import torch.nn.functional as F

class BiLSTMAttention(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, num_classes, dropout=0.3):
        super(BiLSTMAttention, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(
            embed_dim,
            hidden_dim,
            num_layers=2,
            bidirectional=True,
            batch_first=True,
            dropout=dropout
        )
        self.attention = nn.Linear(hidden_dim * 2, 1)
        self.fc = nn.Linear(hidden_dim * 2, num_classes)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        # x: [batch_size, seq_len]
        embedded = self.dropout(self.embedding(x))
        lstm_out, _ = self.lstm(embedded) # [batch_size, seq_len, hidden_dim * 2]

        # Attention weights
        attn_weights = F.softmax(self.attention(lstm_out), dim=1) # [batch_size, seq_len, 1]
        context = torch.sum(attn_weights * lstm_out, dim=1) # [batch_size, hidden_dim * 2]

        out = self.fc(self.dropout(context))
        return out

def train_bilstm_model():
    print("--- Initializing BiLSTM Attention Model ---")
    vocab_size = 10000
    embed_dim = 128
    hidden_dim = 64
    num_classes = 3
    model = BiLSTMAttention(vocab_size, embed_dim, hidden_dim, num_classes)
    print(model)
    print("BiLSTM Attention model initialized. Ready for training loops.")

if __name__ == "__main__":
    train_bilstm_model()
