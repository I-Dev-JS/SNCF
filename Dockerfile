FROM node:15.11.0-alpine3.13

# Setup timezone
ENV TZ Europe/Paris
RUN apk update && \
    apk upgrade && \
    apk add --no-cache tzdata && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

WORKDIR /usr/src/app

COPY . .

# Install dependencies
RUN yarn install --frozen-lockfile

# Transpile Typescript
RUN yarn build

# Reinstall only production dependencies
RUN rm -rf node_modules && \
    yarn install --production=true --frozen-lockfile

# Add crontab file in the cron directory
ADD crontab /var/spool/cron/crontabs/root

# Give execution rights on the cron job
RUN chmod 0644 /var/spool/cron/crontabs/root

CMD /usr/sbin/crond -f -L /dev/stdout
