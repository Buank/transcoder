# VideoTranscoding

This project provides a simple interface for video transcoding.

## Installation (Ubuntu 18.04)

Below is an example of how to build **FFmpeg** with CUDA/NVENC support.

1. Install build tools and dependencies:
   ```bash
   sudo apt-get install gcc
   sudo apt-get install pkg-config
   sudo apt install xz-utils
   ```
2. Download and compile FFmpeg:
   ```bash
   wget https://ffmpeg.org/releases/ffmpeg-4.1.3.tar.bz2
   sudo tar jxf ffmpeg-4.1.3.tar.bz2
   cd ffmpeg-4.1.3
   ./configure --enable-libssh --enable-cuda --enable-cuvid --enable-nvenc --enable-nonfree \
               --enable-libnpp --extra-cflags=-I/usr/local/cuda/include \
               --extra-ldflags=-L/usr/local/cuda/lib64 --enable-librtmp
   # If you see errors with libssh or librtmp
   sudo apt-get install libssh-dev
   sudo apt-get install librtmp-dev
   sudo make && sudo make install
   sudo apt-get install -y software-properties-common
   sudo add-apt-repository ppa:jonathonf/ffmpeg-4
   sudo apt install ffmpeg
   ```
   Install the CUDA driver as well if NVIDIA GPUs are used.

## Running the Application

1. Install Node.js dependencies:
   ```bash
   npm install
   ```
2. Copy `config/env-defaults.js` to `config/env.js` and adjust the values:
   - `chunks` – number of HLS chunks stored per channel (1 chunk = 6 seconds).
   - `serverPort` – port on which the HTTP server runs.
3. Create a `static` folder and place a `playlist.m3u8` file inside it.  
   This file should not be accessible to other users.
4. Start the server:
   ```bash
   npm run start
   ```

### Recommendations

Do not run more than five streams on a low-powered machine as CPU/GPU load may be high.

---

The original Russian instructions are preserved below.

Install VideoTranscoding
----------------------------------------------------------------
[System Ubuntu 18.04]

sudo apt-get install gcc

sudo apt-get install pkg-config

sudo apt install xz-utils

wget https://ffmpeg.org/releases/ffmpeg-4.1.3.tar.bz2

sudo tar jxf ffmpeg-4.1.tar.bz2

cd ffmpeg-4.1

./configure --enable-libssh  --enable-cuda --enable-cuvid --enable-nvenc --enable-nonfree 
            --enable-libnpp --extra-cflags=-I/usr/local/cuda/include 
            --extra-ldflags=-L/usr/local/cuda/lib64 —enable-librtmp
---

Если ошибки с libssh и librtmp

sudo apt-get install libssh-dev

sudo apt-get install librtmp-dev

---

sudo make &&  sudo make install

sudo apt-get install -y software-properties-common

sudo add-apt-repository ppa:jonathonf/ffmpeg-4

sudo apt install ffmpeg

Так же нужно установить cudo driver если используются видеокарты NVIDIA


Introduction
----------------------------------------------------------------

Интерфейс для транскодирования видео

Для запуска программы сделать 

1) npm i

2) создать файл env.js в каталоге /config и заполнить его данныеми как в env-defaults.js

3) в переменную окружения `TELEGRAM_TOKEN` необходимо поместить токен вашего Telegram-бота

4) создать папку static и добавить файл playlist.m3u8 , так как данный файл не должен быть виден другим пользователям.

5) npm run start

При работе с HTTPS сервером используйте корректные TLS-сертификаты. Отключать
проверку сертификата не рекомендуется. Если все же требуется игнорировать
ошибки TLS (например, в среде разработки), задайте переменную окружения
`ALLOW_INVALID_TLS=true` перед запуском сервера.

Рекомендации и дополнительная информация
-----------------------------------------------------------------

**Не запускать больше 5 потоков на слабом компьютере, так как большая нагрузка на проц и видюху.**


`Дополнительная информация по playlist m3u8`

#EXTM3U - определение формата playlist

#EXT-X-VERSION:3  - версия совместимости протоколов

#EXTINF - определяет продолжительность сегмента носителя в секундах.
применяется только к следующему медиа сегменту. Этот тег необходим для каждого носителя(чанка)
TIP -  #EXTINF: duration is a decimal-floating-point

#EXT-X-MEDIA-SEQUENCE указывает порядковый номер носителя
первый мультимедийный сегмент, отображаемый в файле списка воспроизведения.

#EXT-X-TARGETDURATION Типичная продолжительность цели составляет 10 секунд.
EXT-X-ENDLIST указывает, что больше не будет сегментов мультимедиа
 добавленых в файл списка воспроизведения мультимедиа.
 
 Простой пример playlist.m3u8
 
 #EXTM3U
 #EXT-X-VERSION:3
 #EXT-X-TARGETDURATION:6
 #EXT-X-MEDIA-SEQUENCE:9
 #EXTINF:3.840000,
 ap-tv/pervyy_kanal_tv/pervyy_kanal_tv0_009.ts
 #EXTINF:3.840000,
 ap-tv/pervyy_kanal_tv/pervyy_kanal_tv0_010.ts
 #EXTINF:3.840000,
 ap-tv/pervyy_kanal_tv/pervyy_kanal_tv0_011.ts
 #EXTINF:5.760000,
 ap-tv/pervyy_kanal_tv/pervyy_kanal_tv0_012.ts
 #EXTINF:2.080000,
 ap-tv/pervyy_kanal_tv/pervyy_kanal_tv0_013.ts
 #EXT-X-ENDLIST

Пример master playlist.m3u8

#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=2340800,RESOLUTION=1920x1080,CODECS="avc1.4d4028,mp4a.40.2"
pervyy_kanal_tv_0.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=1308077+,RESOLUTION=854x480,CODECS="avc1.4d401e,mp4a.40.2"
pervyy_kanal_tv_1.m3u8

[Команда для теста транскодинга на базе NVIDIA and HLS]

ffmpeg -hwaccel_device 0 -hwaccel cuvid -c:v h264_cuvid -i 
        http://[server]:[port]/s/[token]/pervyj.m3u8 
        -err_detect ignore_err -max_reload 10000 
        -map 0:v:0 -map 0:a:0 -map 0:v:0 -map 0:a:0 
        -c:v h264_nvenc -profile:v main -sc_threshold 0 
        -g 48 -keyint_min 48 -c:a aac -ar 48000 
        -filter:v:0 scale_npp=1920:1080 -maxrate:v:2 2996k 
        -bufsize:v:2 4200k -b:a:2 128k -filter:v:1 
        scale_npp=854:480 -maxrate:v:1 1498k -bufsize:v:1 
        2100k -b:a:1 128k -f hls -var_stream_map "v:0,a:0 
        v:1,a:1" -hls_time 6 -hls_list_size 5 -hls_allow_cache 0 
        -update 1 -master_pl_name master.m3u8 -hls_segment_filename 
        ftp://[user]:[password]@[server]:[port]/path/to/remote/chunck%v_%03d.ts 
        ftp://[user]:[password]@[server]:[port]/path/to/remote/playlist_%v.m3u8
        
