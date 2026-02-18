#define PREFIX UKSFTA
#define SUBPREFIX COP

#include "\x\cba\addons\main\script_macros_common.hpp"

#ifdef SUBCOMPONENT
    #define COMPONENT_NAME QUOTE(PREFIX - SUBPREFIX: COMPONENT - SUBCOMPONENT)
#else
    #define COMPONENT_NAME QUOTE(PREFIX - SUBPREFIX: COMPONENT)
#endif
