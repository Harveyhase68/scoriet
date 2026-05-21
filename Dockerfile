FROM php:8.4-apache

WORKDIR /var/www/scoriet

ENV PKG_CONFIG_PATH=/root/lib/lib/pkgconfig
ENV AUTO_MIGRATE=true

# Install system dependencies FIRST (including PHP extension dependencies)
RUN apt-get update && apt-get install -y \
    git \
    curl \
    nodejs \
    npm \
    libonig-dev \
    libzip-dev \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libwebp-dev \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) pdo_mysql mbstring bcmath gd zip
	
# Rest of the build...
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --optimize-autoloader

COPY package.json package-lock.json ./
COPY . .
COPY .env.docker .env

RUN rm -rf /var/www/html \
    && ln -s /var/www/scoriet/public /var/www/html

# Install npm dependencies
RUN npm install

RUN composer dump-autoload --no-dev --optimize

RUN chown -R www-data:www-data storage bootstrap/cache
RUN a2enmod rewrite

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["apache2-foreground"]