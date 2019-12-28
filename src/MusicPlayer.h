#include <nan.h>

#include "../musicplayer/plugins/plugins.h"

using musix::ChipPlayer;
using musix::ChipPlugin;

typedef struct musix::ChipPlayer ChipPlayer;

class MusicPlayer : public Nan::ObjectWrap {
public:
  ChipPlayer* chipPlayer;

  static NAN_MODULE_INIT(init);
  static NAN_METHOD(New);
  static NAN_METHOD(getMeta);
  static NAN_METHOD(getMetaInt);
  static NAN_METHOD(seek);
  static NAN_METHOD(freePlayer);
  static NAN_METHOD(play);

  static inline Nan::Persistent<v8::Function> & constructor() {
    static Nan::Persistent<v8::Function> my_constructor;
    return my_constructor;
  }
};
