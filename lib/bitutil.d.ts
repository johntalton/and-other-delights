export declare const TRUE_8_PACKMAP: number[];
export declare const REVERSE_TRUE_8_PACKMAP: number[];
export declare type NormalizedPacMapItem = [number, number];
export declare type SloppyPackMapItem = NormalizedPacMapItem | [number] | number;
export declare type PackMap = Array<SloppyPackMapItem>;
export declare type NormalizedPackMap = Array<NormalizedPacMapItem>;
/**
 *
 **/
export declare class BitUtil {
    /**
     * Creates a bit-mask of the given length.
     *
     * @param length The masks length in bits.
     * @returns A mask of the specified length.
     */
    private static mask;
    /**
     * A utility to pack multiple byte-parts into a single value.
     *
     * @param packMap The pack template to parse params by.
     * @param sourceData The parameters to the packMap.
     * @param warnNotNormal If true will log out when non-normal packMap exists.
     * @returns Parameter bits packed into single byte.
     */
    static packBits(packMap: PackMap, sourceData: Array<number>, warnNotNormal?: boolean): number;
    /**
     *  A utility to split a value into its corresponding template parts.
     *
     * @param packMap A template by with to parse bits.
     * @param bits A value to be used to extract the template parts.
     * @param warnNotNormal If true will log out when non-normal format exists.
     * @returns An array of bytes extracted from the bits parameter defined
     *  by the packMap.
     **/
    static unpackBits(packMap: PackMap, bits: number, warnNotNormal?: boolean): Array<number>;
    private static mapBits;
    private static isNonOverlapping;
    private static isOrdered;
    /**
     * Validates and returns explicitly array of two number arrays.
     *
     * All user facing methods should call this before working with
     * user supplied packMap templates.
     *
     * @param packMap A template to process.
     * @param warnStrict If true will log out when non-normal format exists.
     * @returns A packMap with explicitly defined values.
     */
    private static normalizePackMap;
    static decodeTwos(twos: number, length: number): number;
    static reconstructNBit(nbit: number, parts: Array<number>): number;
    static reconstruct10bit(msb: number, lsb_2bit: number): number;
    static reconstruct12bit(msb: number, lsb_4bit: number): number;
    static reconstruct20bit(msb: number, lsb: number, xlsb: number): number;
}
//# sourceMappingURL=bitutil.d.ts.map