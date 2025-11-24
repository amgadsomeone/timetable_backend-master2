# --- Base image ---
FROM node:20

# --- Create app directory ---
WORKDIR /app

# --- Install system dependencies ---
# bzip2 is required to extract .tar.bz2
# wget is required to download the file
RUN apt-get update && apt-get install -y \
    wget \
    bzip2 \
    && rm -rf /var/lib/apt/lists/*

# --- Download FET CLI ---
RUN wget https://lalescu.ro/liviu/fet/download/bin/fet-7.5.7-bin.tar.bz2 -O /tmp/fet.tar.bz2

# --- Extract it ---
RUN mkdir /opt/fet && \
    tar -xvf /tmp/fet.tar.bz2 -C /opt/fet --strip-components=1

# --- Create a global command (symlink) ---
RUN ln -s /opt/fet/usr/bin/fet-cl /usr/local/bin/fet-cl

# --- Copy NestJS files ---
COPY package*.json ./
RUN npm install

COPY . .

# --- Build NestJS ---
RUN npm run build

# --- Expose port ---
EXPOSE 3000


# --- Start the server ---
CMD ["npm", "run", "start:prod"]
