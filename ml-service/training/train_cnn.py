"""
Convolutional Neural Network (TextCNN) training script for sentiment classification.
"""
import os
import torch
import torch.nn as nn
import torch.optim as optim

class TextCNN(nn.Module):
    def __init__(self, vocab_size, embed_dim, num_classes, filter_sizes=[2, 3, 4], num_filters=100):
        super(TextCNN, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.convs = nn.ModuleList([
            nn.Conv1d(in_channels=embed_dim, out_channels=num_filters, kernel_size=fs)
            for fs in filter_sizes
        ])
        self.fc = nn.Linear(len(filter_sizes) * num_filters, num_classes)
        self.dropout = nn.Dropout(0.5)

    def forward(self, x):
        # x shape: [batch_size, seq_len]
        embedded = self.embedding(x).permute(0, 2, 1) # [batch_size, embed_dim, seq_len]
        conved = [torch.relu(conv(embedded)) for conv in self.convs]
        pooled = [torch.max_pool1d(c, c.shape[2]).squeeze(2) for c in conved]
        cat = self.dropout(torch.cat(pooled, dim=1))
        return self.fc(cat)

def train_cnn_model():
    print("--- Initializing TextCNN Architecture ---")
    vocab_size = 10000
    embed_dim = 128
    num_classes = 3 # POSITIVE, NEGATIVE, NEUTRAL
    model = TextCNN(vocab_size, embed_dim, num_classes)
    print(model)
    print("TextCNN pipeline initialized. Ready for training dataset ingestion.")

if __name__ == "__main__":
    train_cnn_model()
