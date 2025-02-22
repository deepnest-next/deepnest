<img src="https://github.com/user-attachments/assets/0f24f4c9-d1af-4db5-9570-37c89b42cdfa" alt="deepnest next" width="250">

# **deepnest**

A fast open source nesting tool for plotter, laser cutters and other CNC tools

deepnest is a desktop application originally based on [SVGNest](https://github.com/Jack000/SVGnest) and [deepnest](https://github.com/Jack000/Deepnest)

- New nesting engine with speed-critical code, written in C (outsourced to an external NodeJs module)
- Merging of common lines for plotter and laser cuts
- Support for DXF files (through conversion)
- New path approximation function for highly complex parts



## Upcoming changes
- more speed with code written in Rust outsourced as modules, the original code was written in JavaScript
- some core libraries rewritten from scratch in Rust so we get even more speed and ensure memory safety
- Save and load settings as presets
- Load nesting projects via CSV or JSON
- Native support of DXF file formats without online conversion
- **Cloud nesting:** Use our cloud for fast nesting of your projects _more soon_ 


## How to Build?

Reed the [Build Docs](BUILD.md)


## License

The main license is the MIT.

- [LICENSE](LICENSE)

Further Licenses:

- [LICENSES](LICENSES.md)

## Fork History

- https://github.com/Jack000/SVGnest (Academic Work References)
- https://github.com/Jack000/Deepnest
  - https://github.com/Dogthemachine/Deepnest
    - https://github.com/cmidgley/Deepnest
      - https://github.com/deepnest-io/Deepnest 
      
        (Not available anymore. ⚠️ don't should be trusted anymore: [readme](https://github.com/deepnest-next/.github/blob/main/profile/why-we-forked-into-a-new-organisation.md))
        - https://github.com/deepnest-next/deepnest

