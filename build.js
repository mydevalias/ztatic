const fs = require('fs');
const path = require('path');

class StaticSiteGenerator {
    constructor() {
        this.contentDir = './content';
        this.layoutDir = './layouts';
        this.outputDir = './dist';
        this.defaultLayout = 'layout';
    }

    setup() {
        [this.contentDir, this.layoutDir, this.outputDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`Created directory: ${dir}`);
            }
        });

        const cssDir = path.join(this.layoutDir, 'css');
        if (!fs.existsSync(cssDir)) {
            fs.mkdirSync(cssDir, { recursive: true });
            console.log(`Created directory: ${cssDir}`);
        }

        const jsDir = path.join(this.layoutDir, 'js');
        if (!fs.existsSync(jsDir)) {
            fs.mkdirSync(jsDir, { recursive: true });
            console.log(`Created directory: ${jsDir}`);
        }

        const vercelConfig = './vercel.json';
        if (!fs.existsSync(vercelConfig)) {
            const config = {
                "outputDirectory": "dist"
            };
            fs.writeFileSync(vercelConfig, JSON.stringify(config, null, 2));
            console.log('Created vercel.json');
        }
    }

    copyLayoutAssets() {
        const cssDir = path.join(this.layoutDir, 'css');
        const jsDir = path.join(this.layoutDir, 'js');

        if (fs.existsSync(cssDir)) {
            this.copyDirectoryStructure(cssDir, path.join(this.outputDir, 'css'));
        }

        if (fs.existsSync(jsDir)) {
            this.copyDirectoryStructure(jsDir, path.join(this.outputDir, 'js'));
        }
    }

    copyDirectoryStructure(srcDir, destDir) {
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        const items = fs.readdirSync(srcDir);
        for (const item of items) {
            const srcPath = path.join(srcDir, item);
            const destPath = path.join(destDir, item);

            if (fs.statSync(srcPath).isDirectory()) {
                this.copyDirectoryStructure(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
                console.log(`Copied: ${destPath}`);
            }
        }
    }

    readLayout(layoutName) {
        const layoutPath = path.join(this.layoutDir, `${layoutName}.html`);
        return fs.readFileSync(layoutPath, 'utf8');
    }

    renderPage(layout, content) {
        return layout.replace(/{{content}}/g, content);
    }

    generatePage(contentPath, outputPath) {
        const content = fs.readFileSync(contentPath, 'utf8');
        const layout = this.readLayout(this.defaultLayout);
        const html = this.renderPage(layout, content);

        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, html);
        console.log(`Generated: ${outputPath}`);
    }

    build() {
        this.setup();

        if (fs.existsSync(this.outputDir)) {
            fs.rmSync(this.outputDir, { recursive: true, force: true });
        }
        fs.mkdirSync(this.outputDir, { recursive: true });

        this.copyLayoutAssets();
        this.processDirectory(this.contentDir, this.outputDir);

        console.log('Build complete!');
    }

    processDirectory(inputDir, outputDir) {
        const items = fs.readdirSync(inputDir);

        for (const item of items) {
            const inputPath = path.join(inputDir, item);
            const outputPath = path.join(outputDir, item);

            if (fs.statSync(inputPath).isDirectory()) {
                this.processDirectory(inputPath, outputPath);
            } else if (item.endsWith('.html')) {
                this.generatePage(inputPath, outputPath);
            } else if (item.endsWith('.css') || item.endsWith('.js') || item.endsWith('.png') || item.endsWith('.jpg') || item.endsWith('.gif') || item.endsWith('.svg')) {
                const outputDir = path.dirname(outputPath);
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }
                fs.copyFileSync(inputPath, outputPath);
                console.log(`Copied: ${outputPath}`);
            }
        }
    }
}

if (require.main === module) {
    const generator = new StaticSiteGenerator();
    const command = process.argv[2];

    if (command === 'build' || !command) {
        generator.build();
    } else {
        console.log('Usage:');
        console.log('  node build.js        - Build the site');
    }
}