// @flow

import {Transformer} from '@parcel/plugin';
import SourceMap from '@parcel/source-map';
import generate from '@babel/generator';
import semver from 'semver';
import babel7 from './babel7';
import {relativeUrl} from '@parcel/utils';
import {load, preSerialize, postDeserialize} from './config';

export default new Transformer({
  async loadConfig({config, options, logger}) {
    await load(config, options, logger);
  },

  preSerializeConfig({config}) {
    return preSerialize(config);
  },

  postDeserializeConfig({config, options}) {
    return postDeserialize(config, options);
  },

  canReuseAST({ast}) {
    return ast.type === 'babel' && semver.satisfies(ast.version, '^7.0.0');
  },

  async transform({asset, config, options}) {
    // TODO: come up with a better name
    if (config?.config) {
      if (asset.meta.babelPlugins && Array.isArray(asset.meta.babelPlugins)) {
        // $FlowFixMe
        asset.ast = await babel7(
          asset,
          options,
          config,
          asset.meta.babelPlugins
        );
      } else {
        asset.ast = await babel7(asset, options, config);
      }
    }

    return [asset];
  },

  generate({asset, options}) {
    let sourceFileName: string = relativeUrl(
      options.projectRoot,
      asset.filePath
    );

    // $FlowFixMe: figure out how to make AST required in generate method
    let generated = generate(asset.ast.program, {
      sourceMaps: options.sourceMaps,
      sourceFileName: sourceFileName
    });

    return {
      code: generated.code,
      map: new SourceMap(generated.rawMappings, {
        [sourceFileName]: null
      })
    };
  }
});
