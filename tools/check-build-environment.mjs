const major = Number.parseInt(process.versions.node.split('.')[0], 10);

if (major !== 22 && major !== 24) {
  console.error(`ORBIT build requires Node.js 22 or 24 LTS; detected ${process.versions.node}.`);
  console.error('Install an LTS release before packaging. The development game launcher is unaffected.');
  process.exit(1);
}

console.log(`ORBIT build environment: PASS (Node ${process.versions.node})`);
