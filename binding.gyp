{
  'variables' : {
    'openssl_fips': '',
  },
  "targets": [
    {
      "target_name": "addon",
      "sources": [ "src/addon.cc", "src/minkowski.cc" ],
      'cflags!': [ '-fno-exceptions' ],
      'cflags_cc!': [ '-fno-exceptions' ],
      'conditions': [
        [ 
          'OS=="win"', {
            'cflags!': [ '-fno-exceptions', "-m64" ],
            "ldflags": [ "-m elf_i386" ],
            'cflags_cc!': [ '-fno-exceptions', '-fPIC -m64' ],
            "defines": [
              "NOMINMAX"
            ],
          }
        ],
        [ 
          'OS=="mac"', {
            'xcode_settings': {
              'GCC_ENABLE_CPP_EXCEPTIONS': 'YES'
            }
          }
        ]
      ],
      "include_dirs" : [
        "<!(node -e \"require('nan')\")",
        "./src/polygon/include"
      ]
    }
  ],
}
