/* @flow */

/**
 * To import/require file from project use aliases:
 *   root, src, actions, assets, components, containers, reducers, config
 * To import/require renderer server file use relative paths.
 */
/* eslint-disable prefer-arrow-callback */

import type { Request, Response, BaseLogger } from '../types';

// Intentionally first require so things like require("newrelic") in
// preInitHook get instantiated before anything else. This improves profiling
const projectHooks = require('gluestick-hooks').default;

const path = require('path');
const fs = require('fs');
const express = require('express');
const compression = require('compression');
const middleware = require('./middleware');
const readAssets = require('./helpers/readAssets');
const onFinished = require('on-finished');
const applicationConfig = require('application-config').default;
const entries = require('project-entries').default;

const hooksHelper = require('./helpers/hooks');
const serverPlugins = require('../plugins/serverPlugins');
const createPluginUtils = require('../plugins/utils');
const setProxies = require('./helpers/setProxies');
const parseRoutePath = require('./helpers/parseRoutePath');

const config = require('../config').default;
const logger = require('../logger').default;

module.exports = function startRenderer() {
  const assetsFilename = path.join(
    process.cwd(),
    config.GSConfig.buildAssetsPath,
    config.GSConfig.webpackChunks,
  );
  if (!fs.existsSync(assetsFilename)) {
    console.log('\n');
    logger.error(
      `File ${assetsFilename} does not exist. Did you forget to compile the client bundle? ` +
        `Run 'gluestick build --client' and try again.`,
    );
  }

  const pluginUtils = createPluginUtils(logger);

  // Use custom logger from plugins or default logger.
  const customLogger: ?BaseLogger = pluginUtils.getCustomLogger(serverPlugins);

  // Merge hooks from project and plugins' hooks.
  const hooks = hooksHelper.merge(projectHooks, serverPlugins);

  // Developers can add an optional hook that
  // includes script with initialization stuff.
  if (hooks.preInitServer) {
    hooksHelper.call(hooks.preInitServer);
  }

  const app: Object = express();
  app.use(compression());
  app.use(
    '/assets',
    express.static(path.join(process.cwd(), config.GSConfig.buildAssetsPath)),
  );

  setProxies(app, applicationConfig.proxies, logger);

  if (process.env.NODE_ENV !== 'production') {
    app.get('/gluestick-proxy-poll', (req: Request, res: Response) => {
      // allow requests from our client side loading page
      res.header('Access-Control-Allow-Origin', '*');
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept',
      );
      res.status(200).json({ up: true });
    });
  }

  // Call express App Hook which accept app as param.
  hooksHelper.call(hooks.postServerRun, app);

  app.use(function gluestickRequestHandler(
    req: Request,
    res: Response,
    next: Function,
  ) {
    // Use SSR middleware only for entries/app routes
    if (
      !Object.keys(entries).find((key: string): boolean =>
        parseRoutePath(key).test(req.url),
      )
    ) {
      next();
      return;
    }

    if (customLogger) {
      customLogger.info({ req });
      onFinished(res, (err, response) => {
        if (err) {
          customLogger.error(err);
        } else {
          customLogger.info({ res: response });
        }
      });
    }

    readAssets(assetsFilename)
      .then((assets: Object): Promise<void> => {
        return middleware({ config, logger }, req, res, {
          assets,
          hooks,
          serverPlugins,
        });
      })
      .catch((error: Error) => {
        logger.error(error);
        res.sendStatus(500);
      });
  });

  // 404 handler
  // @TODO: support custom 404 error page
  app.use((req: Request, res: Response) => {
    logger.warn(`${req.method} ${req.url} was not found`);
    res.sendStatus(404);
  });

  const server: Object = app.listen(config.GSConfig.ports.server);

  logger.success(`Renderer listening on port ${config.GSConfig.ports.server}.`);
  process.on('exit', () => {
    server.close();
  });
  process.on('SIGINT', () => {
    server.close();
  });
};
