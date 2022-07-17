#include "../musicplayer/plugins/plugins.h"
#include <emscripten/bind.h>

using namespace emscripten;

using musix::ChipPlayer;
using musix::ChipPlugin;

typedef struct musix::ChipPlayer ChipPlayer;

struct NESAnalysis {
  int square1Period;
  int square1Volume;
  int square2Period;
  int square2Volume;
  int trianglePeriod;
  int triangleCounter;
  int noiseRate;
  int noiseVolume;
  int dpcmPlaying;

  int vrc6Square1Period;
  int vrc6Square1Volume;
  int vrc6Square2Period;
  int vrc6Square2Volume;
  int vrc6SawPeriod;
  int vrc6SawVolume;
};

class MusicPlayer {
  public:
    MusicPlayer(std::string strName);
    ~MusicPlayer();
    std::string getMeta(std::string metaName);
    int getMetaInt(std::string metaName);
    void seek(int song);
    std::vector<int16_t> play(int size);
    NESAnalysis nesAnalysis();

    static void loadPlugins(std::string dataDir);
    static std::string getExceptionMessage(intptr_t exceptionPtr);

  private:
    ChipPlayer* chipPlayer;
};



EMSCRIPTEN_BINDINGS(music_player) {
  value_object<NESAnalysis>("NESAnalysis")
    .field("square1Period", &NESAnalysis::square1Period)
    .field("square1Volume", &NESAnalysis::square1Volume)
    .field("square2Period", &NESAnalysis::square2Period)
    .field("square2Volume", &NESAnalysis::square2Volume)
    .field("trianglePeriod", &NESAnalysis::trianglePeriod)
    .field("triangleCounter", &NESAnalysis::triangleCounter)
    .field("noiseRate", &NESAnalysis::noiseRate)
    .field("noiseVolume", &NESAnalysis::noiseVolume)
    .field("dpcmPlaying", &NESAnalysis::dpcmPlaying)

    .field("vrc6Square1Period", &NESAnalysis::vrc6Square1Period)
    .field("vrc6Square1Volume", &NESAnalysis::vrc6Square1Volume)
    .field("vrc6Square2Period", &NESAnalysis::vrc6Square2Period)
    .field("vrc6Square2Volume", &NESAnalysis::vrc6Square2Volume)
    .field("vrc6SawPeriod", &NESAnalysis::vrc6SawPeriod)
    .field("vrc6SawVolume", &NESAnalysis::vrc6SawVolume)
    ;

  emscripten::register_vector<int16_t>("vector<int16_t>");

  class_<MusicPlayer>("MusicPlayer")
    .constructor<std::string>()
    .function("getMeta", &MusicPlayer::getMeta)
    .function("getMetaInt", &MusicPlayer::getMetaInt)
    .function("nesAnalysis", &MusicPlayer::nesAnalysis)
    .function("seek", &MusicPlayer::seek)
    .function("play", &MusicPlayer::play)
    .class_function("loadPlugins", &MusicPlayer::loadPlugins)
    .class_function("getExceptionMessage", &MusicPlayer::getExceptionMessage);
    ;
}
