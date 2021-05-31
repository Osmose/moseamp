#include <napi.h>

#include "../musicplayer/plugins/plugins.h"

using musix::ChipPlayer;
using musix::ChipPlugin;

typedef struct musix::ChipPlayer ChipPlayer;

class MusicPlayer : public Napi::ObjectWrap<MusicPlayer> {
  public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    MusicPlayer(const Napi::CallbackInfo& info);

  private:
    ChipPlayer* chipPlayer;
    Napi::Value getMeta(const Napi::CallbackInfo& info);
    Napi::Value getMetaInt(const Napi::CallbackInfo& info);
    void seek(const Napi::CallbackInfo& info);
    void freePlayer(const Napi::CallbackInfo& info);
    Napi::Value play(const Napi::CallbackInfo& info);
    Napi::Value nesAnalysis(const Napi::CallbackInfo& info);
};
