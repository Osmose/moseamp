/**
 * Register of supported file formats.
 */

let registeredAudioFiles = {};
let openDialogFilters = [];


export function register(name, supportedExtensions, AudioFile) {
    openDialogFilters.push({
        name: name,
        extensions: supportedExtensions
    });

    for (let extension of supportedExtensions) {
        if (registeredAudioFiles.hasOwnProperty(extension)) {
            throw new Error(`Cannot register extension ${extension},
                             as it is already registered.`);
        }

        registeredAudioFiles[extension] = AudioFile;
    }
}


export function getOpenDialogFilters() {
    return openDialogFilters;
}


export function getAudioFileForExtension(extension) {
    return registeredAudioFiles[extension];
}
