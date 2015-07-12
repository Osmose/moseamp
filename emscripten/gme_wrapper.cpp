#include <stdlib.h>
#include <stdio.h>
#include "gme.h"
#include "Music_Emu.h"
#include "json.h"

static Music_Emu* emu;
static Music_Emu* infoEmu;
static JsonNode* json_node;
static track_info_t track_info;
static char json_str[2048];
static short audio_buffer[8192 * 2];

void handle_error(const char* str) {
    if (str) {
        printf("Error: %s\n", str); getchar();
        exit(EXIT_FAILURE);
    }
}

extern "C" {
    void open_file(char* filename, int track) {
        handle_error(gme_open_file(filename, &emu, 44100));
        handle_error(gme_start_track(emu, track));
    }

    void start_track(int track) {
        handle_error(gme_start_track(emu, track));
    }

    void seek(long msec) {
        handle_error(gme_seek(emu, msec));
    }

    long current_time() {
        return gme_tell(emu);
    }

    short* generate_sound_data() {
        handle_error(gme_play(emu, 8192 * 2, audio_buffer));
        return audio_buffer;
    }

    int track_has_ended() {
        return gme_track_ended(emu);
    }

    int current_track() {
        return emu->current_track();
    }

    char* song_info(char* filename, int track) {
        json_node = json_mkobject();
        handle_error(gme_open_file(filename, &infoEmu, 44100));
        handle_error(gme_track_info(infoEmu, &track_info, track));

        json_append_member(json_node, "trackCount", json_mknumber(track_info.track_count));
        json_append_member(json_node, "length", json_mknumber(track_info.length));
        json_append_member(json_node, "system", json_mkstring(track_info.system));
        json_append_member(json_node, "game", json_mkstring(track_info.game));
        json_append_member(json_node, "song", json_mkstring(track_info.song));
        json_append_member(json_node, "author", json_mkstring(track_info.author));
        json_append_member(json_node, "copyright", json_mkstring(track_info.copyright));
        json_append_member(json_node, "comment", json_mkstring(track_info.comment));
        json_append_member(json_node, "dumper", json_mkstring(track_info.dumper));
        return json_stringify(json_node, "\t");
    }
}
