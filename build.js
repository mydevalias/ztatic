const fs = require('fs');
const path = require('path');

class StaticSiteGenerator {
    constructor() {
        this.contentDir = './content';
        this.layoutDir = './layouts';
        this.outputDir = './dist';
        this.defaultLayout = 'default';
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
            fs.mkdirSync(outputDir, {recursive: true});
        }

        fs.writeFileSync(outputPath, html);
        console.log(`Generated: ${outputPath}`);
    }

    build() {
        if (fs.existsSync(this.outputDir)) {
            fs.rmSync(this.outputDir, {recursive: true, force: true});
        }
        fs.mkdirSync(this.outputDir, {recursive: true});

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