cmake_minimum_required(VERSION 3.12)

IF(APPLE)
        SET(CMAKE_OSX_ARCHITECTURES "x86_64;arm64" CACHE STRING "Build architectures for Mac OS X" FORCE)
ENDIF(APPLE)

# Name of the project (will be the name of the plugin)
project(musicplayer_node)

set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_definitions(-DNAPI_VERSION=3)

add_compile_definitions(_SILENCE_EXPERIMENTAL_FILESYSTEM_DEPRECATION_WARNING)
add_definitions(-D_SILENCE_EXPERIMENTAL_FILESYSTEM_DEPRECATION_WARNING)
add_definitions(-DNAPI_DISABLE_CPP_EXCEPTIONS)

set(ZLIB_INCLUDE_DIRS ${CMAKE_SOURCE_DIR}/musicplayer/external/zlib ${CMAKE_BINARY_DIR}/musicplayer/external/zlib)
add_subdirectory(musicplayer)

# Build a shared library named after the project from the files in `src/`
set(SOURCE_FILES "src/MusicPlayer.h" "src/MusicPlayer.cc" "src/index.cc")

if(MSVC)
        message(STATUS "It's MSVC, enable win_delay_load_hook")
        set(node_host_binary node)
        set(WIN_DELAY_LOAD_HOOK "src/win_delay_load_hook.cc")
        add_compile_definitions(HOST_BINARY=\"${node_host_binary}${CMAKE_EXECUTABLE_SUFFIX}\")
        add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES} ${WIN_DELAY_LOAD_HOOK})
        set_target_properties(${PROJECT_NAME} PROPERTIES LINK_FLAGS "/DELAYLOAD:${node_host_binary}${CMAKE_EXECUTABLE_SUFFIX}")
else()
        add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES})
endif()

if(APPLE)
        # For reasons unknown MacOS complains about some implicit functions that don't cause any trouble.
        # Disabling warnings makes you attractive and successful.
        target_compile_options(zlibstatic PRIVATE -Wno-implicit-function-declaration)
        target_compile_options(aoplugin PRIVATE -Wno-implicit-function-declaration)
endif()

# Gives our library file a .node extension without any "lib" prefix
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")

# Essential include files to build a node addon,
# You should add this line in every CMake.js based project
target_include_directories(${PROJECT_NAME} PRIVATE ${CMAKE_JS_INC})

# Essential library files to link to a node addon
# You should add this line in every CMake.js based project
target_link_libraries(${PROJECT_NAME} PUBLIC ${CMAKE_JS_LIB} musix plugin_register)

# Include N-API wrappers
execute_process(COMMAND node -p "require('node-addon-api').include"
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
        OUTPUT_VARIABLE NODE_ADDON_API_DIR
)
string(REPLACE "\n" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})
string(REPLACE "\"" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})
target_include_directories(${PROJECT_NAME} PRIVATE ${NODE_ADDON_API_DIR})
