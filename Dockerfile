# Use Python 3.9
FROM python:3.9

# Create a user to avoid running as root
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:${PATH}"

# Set the working directory
WORKDIR /home/user/app

# Copy requirements and install them
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy the rest of the code
COPY --chown=user . .

# Expose the port (Hugging Face uses 7860)
EXPOSE 7860

# Start the application
CMD ["python", "main.py"]
