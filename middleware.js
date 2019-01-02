/*
 * @Author: sky
 * @Date: 2018-12-23 23:22:06
 * @Description: express 中间件 next 函数
 */
const http = require('http');
const url = require('url');


function createApplication() {
    // app 是一个监听函数
    let app = (req, res) => {
        // 取出每一个 layer
        // 1.获取请求的方法、请求的路径
        let m = req.method.toLowerCase();
        let {
            pathname
        } = url.parse(req.url, true);

        // 通过 next 方法进行迭代
        let index = 0;

        function next(err) {

            if (index === app.routes.length) {
                // 如果数组全部迭代完成还没有找到，说明路径不存在
                return res.end(`Connot ${m} ${pathname}`);
            }

            // 每次调用 next 就应该取下一个 layer
            let {
                method,
                path,
                handler
            } = app.routes[index++];

            if (err) {
                // 有错误就去找错误中间件，错误中间件有一个特点 (handler 有四个参数)
                if (handler.length === 4) {
                    handler(err, req, res, next);
                } else {
                    // 没有匹配到，将 err 继续传递下去，继续走下一个 layer 继续判断
                    next(err);
                }
            } else {
                if (method === 'middle') {
                    // 处理中间件
                    if (path === '/' || path === pathname || pathname.startsWith(path + '/')) {
                        handler(req, res, next);
                    } else {
                        // 如果这个中间件没有匹配到，那么继续走下一个层匹配
                        next();
                    }
                } else {
                    // 处理路由
                    if ((method === m || method === 'all') && (path === pathname || path === '*')) {
                        // 2.匹配成功后执行对应的 callback
                        handler(req, res);
                    } else {
                        next();
                    }
                }
            }
        }

        // 中间件中的 next 方法
        next();
    };

    // 存放所有的路由 & 中间件
    app.routes = [];

    /* express 中间件 */
    app.use = (path, handler) => {
        if (typeof handler !== 'function') {
            handler = path;
            // 不写路径默认为 '/'
            path = '/';
        }
        let layer = {
            method: 'middle', // method 是 middle 我们就表示他是一个中间件
            path,
            handler
        };

        // 将中间件放到容器内
        app.routes.push(layer);
    };

    // expres 内置中间件 扩展的中间件
    app.use((req, res, next) => {
        let {
            pathname,
            query
        } = url.parse(req.url, true);
        let hostname = req.handers['host'].split(':')[0];
        req.path = pathname;
        req.query = query;
        req.hostname = hostname;
        next();
    });

    app.all = (path, handler) => {
        // 如果 method 是 all 表示全部匹配
        let layer = {
            method: 'all',
            path,
            handler
        };

        // 加入不同的方法
        app.routes.push(layer);
    };

    /* express 的路由方法 */
    http.METHODS.forEach(method => {

        // 将方法转换成小写的
        // method = method.toLowerCase();
        method = method.toLocaleLowerCase();

        app[method] = (path, handler) => {
            let layer = {
                method,
                path,
                handler
            };

            // 加入不同的方法
            app.routes.push(layer);
        };
    });

    app.listen = function () {
        let server = http.createServer(app);
        server.listen(...arguments);
    };

    return app;
}



module.exports = createApplication;


/* 未实现 */

// 路径参数
// express 子路由
// res 封装
// 模板的渲染