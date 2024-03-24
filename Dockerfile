FROM node:20@sha256:cb7cd40ba6483f37f791e1aace576df449fc5f75332c19ff59e2c6064797160e

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chrome that Puppeteer
# installs, work.
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
    && sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] https://dl-ssl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros fonts-kacst fonts-freefont-ttf libxss1 dbus dbus-x11 \
    --no-install-recommends \
    && service dbus start \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r apiuser && useradd -rm -g apiuser -G audio,video apiuser

USER apiuser

WORKDIR /home/apiuser/app

COPY --chown=apiuser:apiuser package*json tsconfig.json  ./
COPY --chown=apiuser:apiuser src ./src

RUN npm ci && \
    npm run build && \
    npm prune --production

CMD ["node", "/home/apiuser/app/build/index.js"]