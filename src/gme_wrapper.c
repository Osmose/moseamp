#include <stdlib.h>
#include <stdio.h>
#include "gme.h"

const char* info_fmt = "{\"trackCount\": %d, \"length\": %d, \"system\": \"%s\", "
                       "\"game\": \"%s\", \"song\": \"%s\", \"author\": \"%s\", "
                       "\"copyright\": \"%s\", \"comment\": \"%s\", \"dumper\": \"%s\"}";

static Music_Emu* emu;
static track_info_t track_info;
static char json_str[2048];
static short audio_buffer[8192 * 2];

void handle_error(const char* str) {
    if (str) {
        printf("Error: %s\n", str); getchar();
        exit(EXIT_FAILURE);
    }
}

void open_file(char* filename, int track) {
    handle_error(gme_open_file(filename, &emu, 44100));
    handle_error(gme_start_track(emu, track));
}

void start_track(int track) {
    handle_error(gme_start_track(emu, track));
}

short* generate_sound_data() {
    handle_error(gme_play(emu, 8192 * 2, audio_buffer));
    return audio_buffer;
}

char* song_info(int track) {
    handle_error(gme_track_info(emu, &track_info, track));

    sprintf(json_str, info_fmt, track_info.track_count, track_info.length,
            track_info.system, track_info.game, track_info.song, track_info.author,
            track_info.copyright, track_info.comment, track_info.dumper);
    return json_str;
}
