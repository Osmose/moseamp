#include "MusicPlayer.h"
#include "../musicplayer/plugins/plugins.h"
// #include "../musicplayer/plugins/gmeplugin/GMEPlugin.cpp"

using musix::ChipPlayer;
using musix::ChipPlugin;

void MusicPlayer::loadPlugins(std::string dataDir) {
  printf("LOADING PLUGINS\n");
  printf("Data dir: %s\n", dataDir.c_str());
  ChipPlugin::createPlugins(dataDir);
}

MusicPlayer::MusicPlayer(std::string strName) {
  const char *name = strName.c_str();

  // Load chipplayer instance
  ChipPlayer* chipPlayer;
  for(auto &plugin : ChipPlugin::getPlugins()) {
    printf("Checking plugin: %s\n", plugin->name().c_str());
    if(plugin->canHandle(name)) {
      auto ptr = plugin->fromFile(name);
      if(ptr != nullptr) {
        chipPlayer = ptr;
        break;
      }
    }
  }

  if(!chipPlayer) {
    throw std::runtime_error("MusicPlayer: no plugin could handle file");
  }

  this->chipPlayer = chipPlayer;
}

MusicPlayer::~MusicPlayer() {
  delete this->chipPlayer;
}

std::string MusicPlayer::getMeta(std::string metaName){
    return this->chipPlayer->getMeta(metaName);
}

int MusicPlayer::getMetaInt(std::string metaName){
    return this->chipPlayer->getMetaInt(metaName);
}

NESAnalysis MusicPlayer::nesAnalysis(){
    NESAnalysis returnValue;

//     musix::GMEPlayer* gmePlayer = dynamic_cast<musix::GMEPlayer*>(this->chipPlayer);
//     musix::nesAnalysis result = gmePlayer->getNesAnalysis();
//
//     returnValue.square1Period = result.square1Period;
//     returnValue.square1Volume = result.square1Volume;
//     returnValue.square2Period = result.square2Period;
//     returnValue.square2Volume = result.square2Volume;
//     returnValue.trianglePeriod = result.trianglePeriod;
//     returnValue.triangleCounter = result.triangleCounter;
//     returnValue.noiseRate = result.noiseRate;
//     returnValue.noiseVolume = result.noiseVolume;
//     returnValue.dpcmPlaying = result.dpcmPlaying;
//
//     returnValue.vrc6Square1Period = result.vrc6Square1Period;
//     returnValue.vrc6Square1Volume = result.vrc6Square1Volume;
//     returnValue.vrc6Square2Period = result.vrc6Square2Period;
//     returnValue.vrc6Square2Volume = result.vrc6Square2Volume;
//     returnValue.vrc6SawPeriod = result.vrc6SawPeriod;
//     returnValue.vrc6SawVolume = result.vrc6SawVolume;

    return returnValue;
}

void MusicPlayer::seek(int song) {
    this->chipPlayer->seekTo(song, 0);
}

std::vector<int16_t> MusicPlayer::play(int size) {
  std::vector<int16_t> samples(size, 0);
  this->chipPlayer->getSamples(&samples[0], size);
  return samples;
}

std::string MusicPlayer::getExceptionMessage(intptr_t exceptionPtr) {
  return std::string(reinterpret_cast<std::exception *>(exceptionPtr)->what());
}
