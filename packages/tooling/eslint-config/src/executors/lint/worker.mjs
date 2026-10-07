import { parentPort, workerData } from 'node:worker_threads';
import { captureConsole, lintProject, loadCli } from './lint.mjs';

const cli = loadCli(workerData.root);

parentPort.on('message', async ({ task, projectRoot, args }) => {
  const startTime = Date.now();
  const { value: code, output } = await captureConsole(() =>
    lintProject(cli, workerData.root, projectRoot, args)
  );
  parentPort.postMessage({
    task,
    result: {
      success: code === 0,
      terminalOutput: output,
      startTime,
      endTime: Date.now()
    }
  });
});
