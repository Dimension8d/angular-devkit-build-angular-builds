"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable
// TODO: cleanup this file, it's copied as is from Angular CLI.
const core_1 = require("@angular-devkit/core");
const crypto = require("crypto");
const fs = require("fs");
const semver = require("semver");
const require_project_module_1 = require("../require-project-module");
const operators_1 = require("rxjs/operators");
const rxjs_1 = require("rxjs");
exports.NEW_SW_VERSION = '5.0.0-rc.0';
class CliFilesystem {
    constructor(_host, base) {
        this._host = _host;
        this.base = base;
    }
    list(path) {
        const recursiveList = (path) => this._host.list(path).pipe(
        // Emit each fragment individually.
        operators_1.concatMap(fragments => rxjs_1.from(fragments)), 
        // Join the path with fragment.
        operators_1.map(fragment => core_1.join(path, fragment)), 
        // Emit directory content paths instead of the directory path.
        operators_1.mergeMap(path => this._host.isDirectory(path).pipe(operators_1.concatMap(isDir => isDir ? recursiveList(path) : rxjs_1.of(path)))));
        return recursiveList(this._resolve(path)).pipe(operators_1.map(path => path.replace(this.base, '')), operators_1.toArray()).toPromise().then(x => x, _err => []);
    }
    read(path) {
        return this._host.read(this._resolve(path))
            .toPromise()
            .then(content => core_1.virtualFs.fileBufferToString(content));
    }
    hash(path) {
        const sha1 = crypto.createHash('sha1');
        return this.read(path)
            .then(content => sha1.update(content))
            .then(() => sha1.digest('hex'));
    }
    write(path, content) {
        return this._host.write(this._resolve(path), core_1.virtualFs.stringToFileBuffer(content))
            .toPromise();
    }
    _resolve(path) {
        return core_1.join(core_1.normalize(this.base), path);
    }
}
function usesServiceWorker(projectRoot) {
    let swPackageJsonPath;
    try {
        swPackageJsonPath = require_project_module_1.resolveProjectModule(projectRoot, '@angular/service-worker/package.json');
    }
    catch (_) {
        // @angular/service-worker is not installed
        throw new Error(core_1.tags.stripIndent `
    Your project is configured with serviceWorker = true, but @angular/service-worker
    is not installed. Run \`npm install --save-dev @angular/service-worker\`
    and try again, or run \`ng set apps.0.serviceWorker=false\` in your .angular-cli.json.
  `);
    }
    const swPackageJson = fs.readFileSync(swPackageJsonPath).toString();
    const swVersion = JSON.parse(swPackageJson)['version'];
    if (!semver.gte(swVersion, exports.NEW_SW_VERSION)) {
        throw new Error(core_1.tags.stripIndent `
    The installed version of @angular/service-worker is ${swVersion}. This version of the CLI
    requires the @angular/service-worker version to satisfy ${exports.NEW_SW_VERSION}. Please upgrade
    your service worker version.
  `);
    }
    return true;
}
exports.usesServiceWorker = usesServiceWorker;
function augmentAppWithServiceWorker(host, projectRoot, appRoot, outputPath, baseHref, ngswConfigPath) {
    // Path to the worker script itself.
    const distPath = core_1.normalize(outputPath);
    const workerPath = core_1.normalize(require_project_module_1.resolveProjectModule(core_1.getSystemPath(projectRoot), '@angular/service-worker/ngsw-worker.js'));
    const swConfigPath = require_project_module_1.resolveProjectModule(core_1.getSystemPath(projectRoot), '@angular/service-worker/config');
    const safetyPath = core_1.join(core_1.dirname(workerPath), 'safety-worker.js');
    const configPath = ngswConfigPath || core_1.join(appRoot, 'ngsw-config.json');
    return host.exists(configPath).pipe(operators_1.switchMap(exists => {
        if (!exists) {
            throw new Error(core_1.tags.oneLine `
          Error: Expected to find an ngsw-config.json configuration
          file in the ${appRoot} folder. Either provide one or disable Service Worker
          in your angular.json configuration file.`);
        }
        return host.read(configPath);
    }), operators_1.map(content => JSON.parse(core_1.virtualFs.fileBufferToString(content))), operators_1.switchMap(configJson => {
        const Generator = require(swConfigPath).Generator;
        const gen = new Generator(new CliFilesystem(host, outputPath), baseHref);
        return gen.process(configJson);
    }), operators_1.switchMap(output => {
        const manifest = JSON.stringify(output, null, 2);
        return host.read(workerPath).pipe(operators_1.switchMap(workerCode => {
            return rxjs_1.merge(host.write(core_1.join(distPath, 'ngsw.json'), core_1.virtualFs.stringToFileBuffer(manifest)), host.write(core_1.join(distPath, 'ngsw-worker.js'), workerCode));
        }));
    }), operators_1.switchMap(() => host.exists(safetyPath)), 
    // If @angular/service-worker has the safety script, copy it into two locations.
    operators_1.switchMap(exists => {
        if (!exists) {
            return rxjs_1.of(undefined);
        }
        return host.read(safetyPath).pipe(operators_1.switchMap(safetyCode => {
            return rxjs_1.merge(host.write(core_1.join(distPath, 'worker-basic.min.js'), safetyCode), host.write(core_1.join(distPath, 'safety-worker.js'), safetyCode));
        }));
    }), 
    // Remove all elements, reduce them to a single emit.
    operators_1.reduce(() => { })).toPromise();
}
exports.augmentAppWithServiceWorker = augmentAppWithServiceWorker;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL2FuZ3VsYXItY2xpLWZpbGVzL3V0aWxpdGllcy9zZXJ2aWNlLXdvcmtlci9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlCQUFpQjtBQUNqQiwrREFBK0Q7QUFDL0QsK0NBQWdIO0FBRWhILGlDQUFpQztBQUNqQyx5QkFBeUI7QUFDekIsaUNBQWlDO0FBRWpDLHNFQUFpRTtBQUNqRSw4Q0FBMkY7QUFDM0YsK0JBQW1EO0FBR3RDLFFBQUEsY0FBYyxHQUFHLFlBQVksQ0FBQztBQUczQztJQUNFLFlBQW9CLEtBQXFCLEVBQVUsSUFBWTtRQUEzQyxVQUFLLEdBQUwsS0FBSyxDQUFnQjtRQUFVLFNBQUksR0FBSixJQUFJLENBQVE7SUFBSSxDQUFDO0lBRXBFLElBQUksQ0FBQyxJQUFZO1FBQ2YsTUFBTSxhQUFhLEdBQUcsQ0FBQyxJQUFVLEVBQW9CLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJO1FBQ2hGLG1DQUFtQztRQUNuQyxxQkFBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsV0FBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3ZDLCtCQUErQjtRQUMvQixlQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxXQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3JDLDhEQUE4RDtRQUM5RCxvQkFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUM5QyxxQkFBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQUUsQ0FB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QkFBcUIsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxFQUM3RCxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQUksQ0FBQyxRQUFRLEVBQUUsa0JBQWtCLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FDdkMsQ0FBQztRQUN4QixDQUFDLENBQUMsQ0FDSCxDQUFDO0lBQ0osQ0FBQyxDQUFDO0lBRUYscURBQXFEO0lBQ3JELGtCQUFNLENBQUMsR0FBRyxFQUFFLEdBQUUsQ0FBQyxDQUFDLENBQ2pCLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDaEIsQ0FBQztBQXhFRCxrRUF3RUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0c2xpbnQ6ZGlzYWJsZVxuLy8gVE9ETzogY2xlYW51cCB0aGlzIGZpbGUsIGl0J3MgY29waWVkIGFzIGlzIGZyb20gQW5ndWxhciBDTEkuXG5pbXBvcnQgeyBQYXRoLCBqb2luLCBub3JtYWxpemUsIHZpcnR1YWxGcywgZGlybmFtZSwgZ2V0U3lzdGVtUGF0aCwgdGFncywgZnJhZ21lbnQgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBGaWxlc3lzdGVtIH0gZnJvbSAnQGFuZ3VsYXIvc2VydmljZS13b3JrZXIvY29uZmlnJztcbmltcG9ydCAqIGFzIGNyeXB0byBmcm9tICdjcnlwdG8nO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5cbmltcG9ydCB7IHJlc29sdmVQcm9qZWN0TW9kdWxlIH0gZnJvbSAnLi4vcmVxdWlyZS1wcm9qZWN0LW1vZHVsZSc7XG5pbXBvcnQgeyBtYXAsIHJlZHVjZSwgc3dpdGNoTWFwLCBjb25jYXRNYXAsIG1lcmdlTWFwLCB0b0FycmF5LCB0YXAgfSBmcm9tIFwicnhqcy9vcGVyYXRvcnNcIjtcbmltcG9ydCB7IE9ic2VydmFibGUsIG1lcmdlLCBvZiwgZnJvbSB9IGZyb20gXCJyeGpzXCI7XG5cblxuZXhwb3J0IGNvbnN0IE5FV19TV19WRVJTSU9OID0gJzUuMC4wLXJjLjAnO1xuXG5cbmNsYXNzIENsaUZpbGVzeXN0ZW0gaW1wbGVtZW50cyBGaWxlc3lzdGVtIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfaG9zdDogdmlydHVhbEZzLkhvc3QsIHByaXZhdGUgYmFzZTogc3RyaW5nKSB7IH1cblxuICBsaXN0KHBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBjb25zdCByZWN1cnNpdmVMaXN0ID0gKHBhdGg6IFBhdGgpOiBPYnNlcnZhYmxlPFBhdGg+ID0+IHRoaXMuX2hvc3QubGlzdChwYXRoKS5waXBlKFxuICAgICAgLy8gRW1pdCBlYWNoIGZyYWdtZW50IGluZGl2aWR1YWxseS5cbiAgICAgIGNvbmNhdE1hcChmcmFnbWVudHMgPT4gZnJvbShmcmFnbWVudHMpKSxcbiAgICAgIC8vIEpvaW4gdGhlIHBhdGggd2l0aCBmcmFnbWVudC5cbiAgICAgIG1hcChmcmFnbWVudCA9PiBqb2luKHBhdGgsIGZyYWdtZW50KSksXG4gICAgICAvLyBFbWl0IGRpcmVjdG9yeSBjb250ZW50IHBhdGhzIGluc3RlYWQgb2YgdGhlIGRpcmVjdG9yeSBwYXRoLlxuICAgICAgbWVyZ2VNYXAocGF0aCA9PiB0aGlzLl9ob3N0LmlzRGlyZWN0b3J5KHBhdGgpLnBpcGUoXG4gICAgICAgICAgY29uY2F0TWFwKGlzRGlyID0+IGlzRGlyID8gcmVjdXJzaXZlTGlzdChwYXRoKSA6IG9mKHBhdGgpKVxuICAgICAgICApXG4gICAgICApLFxuICAgICk7XG5cbiAgICByZXR1cm4gcmVjdXJzaXZlTGlzdCh0aGlzLl9yZXNvbHZlKHBhdGgpKS5waXBlKFxuICAgICAgbWFwKHBhdGggPT4gcGF0aC5yZXBsYWNlKHRoaXMuYmFzZSwgJycpKSxcbiAgICAgIHRvQXJyYXkoKSxcbiAgICApLnRvUHJvbWlzZSgpLnRoZW4oeCA9PiB4LCBfZXJyID0+IFtdKTtcbiAgfVxuXG4gIHJlYWQocGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy5faG9zdC5yZWFkKHRoaXMuX3Jlc29sdmUocGF0aCkpXG4gICAgICAudG9Qcm9taXNlKClcbiAgICAgIC50aGVuKGNvbnRlbnQgPT4gdmlydHVhbEZzLmZpbGVCdWZmZXJUb1N0cmluZyhjb250ZW50KSk7XG4gIH1cblxuICBoYXNoKHBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2hhMSA9IGNyeXB0by5jcmVhdGVIYXNoKCdzaGExJyk7XG5cbiAgICByZXR1cm4gdGhpcy5yZWFkKHBhdGgpXG4gICAgICAudGhlbihjb250ZW50ID0+IHNoYTEudXBkYXRlKGNvbnRlbnQpKVxuICAgICAgLnRoZW4oKCkgPT4gc2hhMS5kaWdlc3QoJ2hleCcpKTtcbiAgfVxuXG4gIHdyaXRlKHBhdGg6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuX2hvc3Qud3JpdGUodGhpcy5fcmVzb2x2ZShwYXRoKSwgdmlydHVhbEZzLnN0cmluZ1RvRmlsZUJ1ZmZlcihjb250ZW50KSlcbiAgICAgIC50b1Byb21pc2UoKTtcbiAgfVxuXG4gIHByaXZhdGUgX3Jlc29sdmUocGF0aDogc3RyaW5nKTogUGF0aCB7XG4gICAgcmV0dXJuIGpvaW4obm9ybWFsaXplKHRoaXMuYmFzZSksIHBhdGgpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VzU2VydmljZVdvcmtlcihwcm9qZWN0Um9vdDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGxldCBzd1BhY2thZ2VKc29uUGF0aDtcblxuICB0cnkge1xuICAgIHN3UGFja2FnZUpzb25QYXRoID0gcmVzb2x2ZVByb2plY3RNb2R1bGUocHJvamVjdFJvb3QsICdAYW5ndWxhci9zZXJ2aWNlLXdvcmtlci9wYWNrYWdlLmpzb24nKTtcbiAgfSBjYXRjaCAoXykge1xuICAgIC8vIEBhbmd1bGFyL3NlcnZpY2Utd29ya2VyIGlzIG5vdCBpbnN0YWxsZWRcbiAgICB0aHJvdyBuZXcgRXJyb3IodGFncy5zdHJpcEluZGVudGBcbiAgICBZb3VyIHByb2plY3QgaXMgY29uZmlndXJlZCB3aXRoIHNlcnZpY2VXb3JrZXIgPSB0cnVlLCBidXQgQGFuZ3VsYXIvc2VydmljZS13b3JrZXJcbiAgICBpcyBub3QgaW5zdGFsbGVkLiBSdW4gXFxgbnBtIGluc3RhbGwgLS1zYXZlLWRldiBAYW5ndWxhci9zZXJ2aWNlLXdvcmtlclxcYFxuICAgIGFuZCB0cnkgYWdhaW4sIG9yIHJ1biBcXGBuZyBzZXQgYXBwcy4wLnNlcnZpY2VXb3JrZXI9ZmFsc2VcXGAgaW4geW91ciAuYW5ndWxhci1jbGkuanNvbi5cbiAgYCk7XG4gIH1cblxuICBjb25zdCBzd1BhY2thZ2VKc29uID0gZnMucmVhZEZpbGVTeW5jKHN3UGFja2FnZUpzb25QYXRoKS50b1N0cmluZygpO1xuICBjb25zdCBzd1ZlcnNpb24gPSBKU09OLnBhcnNlKHN3UGFja2FnZUpzb24pWyd2ZXJzaW9uJ107XG5cbiAgaWYgKCFzZW12ZXIuZ3RlKHN3VmVyc2lvbiwgTkVXX1NXX1ZFUlNJT04pKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKHRhZ3Muc3RyaXBJbmRlbnRgXG4gICAgVGhlIGluc3RhbGxlZCB2ZXJzaW9uIG9mIEBhbmd1bGFyL3NlcnZpY2Utd29ya2VyIGlzICR7c3dWZXJzaW9ufS4gVGhpcyB2ZXJzaW9uIG9mIHRoZSBDTElcbiAgICByZXF1aXJlcyB0aGUgQGFuZ3VsYXIvc2VydmljZS13b3JrZXIgdmVyc2lvbiB0byBzYXRpc2Z5ICR7TkVXX1NXX1ZFUlNJT059LiBQbGVhc2UgdXBncmFkZVxuICAgIHlvdXIgc2VydmljZSB3b3JrZXIgdmVyc2lvbi5cbiAgYCk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGF1Z21lbnRBcHBXaXRoU2VydmljZVdvcmtlcihcbiAgaG9zdDogdmlydHVhbEZzLkhvc3QsXG4gIHByb2plY3RSb290OiBQYXRoLFxuICBhcHBSb290OiBQYXRoLFxuICBvdXRwdXRQYXRoOiBQYXRoLFxuICBiYXNlSHJlZjogc3RyaW5nLFxuICBuZ3N3Q29uZmlnUGF0aD86IHN0cmluZyxcbik6IFByb21pc2U8dm9pZD4ge1xuICAvLyBQYXRoIHRvIHRoZSB3b3JrZXIgc2NyaXB0IGl0c2VsZi5cbiAgY29uc3QgZGlzdFBhdGggPSBub3JtYWxpemUob3V0cHV0UGF0aCk7XG4gIGNvbnN0IHdvcmtlclBhdGggPSBub3JtYWxpemUoXG4gICAgcmVzb2x2ZVByb2plY3RNb2R1bGUoZ2V0U3lzdGVtUGF0aChwcm9qZWN0Um9vdCksICdAYW5ndWxhci9zZXJ2aWNlLXdvcmtlci9uZ3N3LXdvcmtlci5qcycpLFxuICApO1xuICBjb25zdCBzd0NvbmZpZ1BhdGggPSByZXNvbHZlUHJvamVjdE1vZHVsZShcbiAgICBnZXRTeXN0ZW1QYXRoKHByb2plY3RSb290KSxcbiAgICAnQGFuZ3VsYXIvc2VydmljZS13b3JrZXIvY29uZmlnJyxcbiAgKTtcbiAgY29uc3Qgc2FmZXR5UGF0aCA9IGpvaW4oZGlybmFtZSh3b3JrZXJQYXRoKSwgJ3NhZmV0eS13b3JrZXIuanMnKTtcbiAgY29uc3QgY29uZmlnUGF0aCA9IG5nc3dDb25maWdQYXRoIGFzIFBhdGggfHwgam9pbihhcHBSb290LCAnbmdzdy1jb25maWcuanNvbicpO1xuXG4gIHJldHVybiBob3N0LmV4aXN0cyhjb25maWdQYXRoKS5waXBlKFxuICAgIHN3aXRjaE1hcChleGlzdHMgPT4ge1xuICAgICAgaWYgKCFleGlzdHMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHRhZ3Mub25lTGluZWBcbiAgICAgICAgICBFcnJvcjogRXhwZWN0ZWQgdG8gZmluZCBhbiBuZ3N3LWNvbmZpZy5qc29uIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICBmaWxlIGluIHRoZSAke2FwcFJvb3R9IGZvbGRlci4gRWl0aGVyIHByb3ZpZGUgb25lIG9yIGRpc2FibGUgU2VydmljZSBXb3JrZXJcbiAgICAgICAgICBpbiB5b3VyIGFuZ3VsYXIuanNvbiBjb25maWd1cmF0aW9uIGZpbGUuYCxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGhvc3QucmVhZChjb25maWdQYXRoKSBhcyBPYnNlcnZhYmxlPHZpcnR1YWxGcy5GaWxlQnVmZmVyPjtcbiAgICB9KSxcbiAgICBtYXAoY29udGVudCA9PiBKU09OLnBhcnNlKHZpcnR1YWxGcy5maWxlQnVmZmVyVG9TdHJpbmcoY29udGVudCkpKSxcbiAgICBzd2l0Y2hNYXAoY29uZmlnSnNvbiA9PiB7XG4gICAgICBjb25zdCBHZW5lcmF0b3IgPSByZXF1aXJlKHN3Q29uZmlnUGF0aCkuR2VuZXJhdG9yO1xuICAgICAgY29uc3QgZ2VuID0gbmV3IEdlbmVyYXRvcihuZXcgQ2xpRmlsZXN5c3RlbShob3N0LCBvdXRwdXRQYXRoKSwgYmFzZUhyZWYpO1xuXG4gICAgICByZXR1cm4gZ2VuLnByb2Nlc3MoY29uZmlnSnNvbik7XG4gICAgfSksXG5cbiAgICBzd2l0Y2hNYXAob3V0cHV0ID0+IHtcbiAgICAgIGNvbnN0IG1hbmlmZXN0ID0gSlNPTi5zdHJpbmdpZnkob3V0cHV0LCBudWxsLCAyKTtcbiAgICAgIHJldHVybiBob3N0LnJlYWQod29ya2VyUGF0aCkucGlwZShcbiAgICAgICAgc3dpdGNoTWFwKHdvcmtlckNvZGUgPT4ge1xuICAgICAgICAgIHJldHVybiBtZXJnZShcbiAgICAgICAgICAgIGhvc3Qud3JpdGUoam9pbihkaXN0UGF0aCwgJ25nc3cuanNvbicpLCB2aXJ0dWFsRnMuc3RyaW5nVG9GaWxlQnVmZmVyKG1hbmlmZXN0KSksXG4gICAgICAgICAgICBob3N0LndyaXRlKGpvaW4oZGlzdFBhdGgsICduZ3N3LXdvcmtlci5qcycpLCB3b3JrZXJDb2RlKSxcbiAgICAgICAgICApIGFzIE9ic2VydmFibGU8dm9pZD47XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9KSxcblxuICAgIHN3aXRjaE1hcCgoKSA9PiBob3N0LmV4aXN0cyhzYWZldHlQYXRoKSksXG4gICAgLy8gSWYgQGFuZ3VsYXIvc2VydmljZS13b3JrZXIgaGFzIHRoZSBzYWZldHkgc2NyaXB0LCBjb3B5IGl0IGludG8gdHdvIGxvY2F0aW9ucy5cbiAgICBzd2l0Y2hNYXAoZXhpc3RzID0+IHtcbiAgICAgIGlmICghZXhpc3RzKSB7XG4gICAgICAgIHJldHVybiBvZjx2b2lkPih1bmRlZmluZWQpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gaG9zdC5yZWFkKHNhZmV0eVBhdGgpLnBpcGUoXG4gICAgICAgIHN3aXRjaE1hcChzYWZldHlDb2RlID0+IHtcbiAgICAgICAgICByZXR1cm4gbWVyZ2UoXG4gICAgICAgICAgICBob3N0LndyaXRlKGpvaW4oZGlzdFBhdGgsICd3b3JrZXItYmFzaWMubWluLmpzJyksIHNhZmV0eUNvZGUpLFxuICAgICAgICAgICAgaG9zdC53cml0ZShqb2luKGRpc3RQYXRoLCAnc2FmZXR5LXdvcmtlci5qcycpLCBzYWZldHlDb2RlKSxcbiAgICAgICAgICApIGFzIE9ic2VydmFibGU8dm9pZD47XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9KSxcblxuICAgIC8vIFJlbW92ZSBhbGwgZWxlbWVudHMsIHJlZHVjZSB0aGVtIHRvIGEgc2luZ2xlIGVtaXQuXG4gICAgcmVkdWNlKCgpID0+IHt9KSxcbiAgKS50b1Byb21pc2UoKTtcbn1cbiJdfQ==