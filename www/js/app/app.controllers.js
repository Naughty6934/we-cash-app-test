angular.module('your_app_name.app.controllers', [])


  .controller('AppCtrl', function ($rootScope, $scope, AuthService) {

    //this will represent our logged user
    var user = AuthService.getLoggedUser();
    $scope.loggedUser = user;

    $rootScope.$on('userLoggedIn', function (e, data) {
      user = AuthService.getLoggedUser();
      $scope.loggedUser = user;
    });

  })


  .controller('ProfileCtrl', function ($scope, $stateParams, PostService, $ionicHistory, $state, $ionicScrollDelegate) {

    $scope.$on('$ionicView.afterEnter', function () {
      $ionicScrollDelegate.$getByHandle('profile-scroll').resize();
    });

    var userId = $stateParams.userId;

    $scope.myProfile = $scope.loggedUser._id == userId;
    $scope.posts = [];
    $scope.likes = [];
    $scope.user = {};

    PostService.getUserPosts(userId).then(function (data) {
      $scope.posts = data;
    });

    PostService.getUserDetails(userId).then(function (data) {
      $scope.user = data;
    });

    PostService.getUserLikes(userId).then(function (data) {
      $scope.likes = data;
    });

    $scope.getUserLikes = function (userId) {
      //we need to do this in order to prevent the back to change
      $ionicHistory.currentView($ionicHistory.backView());
      $ionicHistory.nextViewOptions({ disableAnimate: true });

      $state.go('app.profile.likes', { userId: userId });
    };

    $scope.getUserPosts = function (userId) {
      //we need to do this in order to prevent the back to change
      $ionicHistory.currentView($ionicHistory.backView());
      $ionicHistory.nextViewOptions({ disableAnimate: true });

      $state.go('app.profile.posts', { userId: userId });
    };

  })


  .controller('ProductCtrl', function ($scope, $stateParams, ShopService, $ionicPopup, $ionicLoading) {
    var productId = $stateParams.productId;

    ShopService.getProduct(productId).then(function (product) {
      $scope.product = product;
    });

    // show add to cart popup on button click
    $scope.showAddToCartPopup = function (product) {
      $scope.data = {};
      $scope.data.product = product;
      $scope.data.productOption = 1;
      $scope.data.productQuantity = 1;

      var myPopup = $ionicPopup.show({
        cssClass: 'add-to-cart-popup',
        templateUrl: 'views/app/shop/partials/add-to-cart-popup.html',
        title: 'Add to Cart',
        scope: $scope,
        buttons: [
          { text: '', type: 'close-popup ion-ios-close-outline' },
          {
            text: 'Add to cart',
            onTap: function (e) {
              return $scope.data;
            }
          }
        ]
      });
      myPopup.then(function (res) {
        if (res) {
          $ionicLoading.show({ template: '<ion-spinner icon="ios"></ion-spinner><p style="margin: 5px 0 0 0;">Adding to cart</p>', duration: 1000 });
          ShopService.addProductToCart(res.product);
          console.log('Item added to cart!', res);
        }
        else {
          console.log('Popup closed');
        }
      });
    };
  })


  .controller('PostCardCtrl', function ($scope, PostService, $ionicPopup, $state) {
    var commentsPopup = {};

    $scope.navigateToUserProfile = function (user) {
      commentsPopup.close();
      $state.go('app.profile.posts', { userId: user._id });
    };

    $scope.showComments = function (post) {
      PostService.getPostComments(post)
        .then(function (data) {
          post.comments_list = data;
          commentsPopup = $ionicPopup.show({
            cssClass: 'popup-outer comments-view',
            templateUrl: 'views/app/partials/comments.html',
            scope: angular.extend($scope, { current_post: post }),
            title: post.comments + ' Comments',
            buttons: [
              { text: '', type: 'close-popup ion-ios-close-outline' }
            ]
          });
        });
    };
  })

  .controller('FeedCtrl', function ($scope, PostService, $ionicPopup, $state) {
    $scope.posts = [];
    $scope.page = 1;
    $scope.totalPages = 1;

    $scope.doRefresh = function () {
      PostService.getFeed(1)
        .then(function (data) {
          $scope.totalPages = data.totalPages;
          $scope.posts = data.posts;

          $scope.$broadcast('scroll.refreshComplete');
        });
    };

    $scope.getNewData = function () {
      //do something to load your new data here
      $scope.$broadcast('scroll.refreshComplete');
    };

    $scope.loadMoreData = function () {
      $scope.page += 1;

      PostService.getFeed($scope.page)
        .then(function (data) {
          //We will update this value in every request because new posts can be created
          $scope.totalPages = data.totalPages;
          $scope.posts = $scope.posts.concat(data.posts);

          $scope.$broadcast('scroll.infiniteScrollComplete');
        });
    };

    $scope.moreDataCanBeLoaded = function () {
      return $scope.totalPages > $scope.page;
    };

    $scope.doRefresh();

  })


  .controller('ShopCtrl', function ($scope, ShopService, AuthService,ExchangeService) {
    $scope.data = {};
    $scope.products = [];
    $scope.popular_products = [];
    ShopService.getProducts().then(function (products) {
      $scope.products = products;
    });
ExchangeService.getExchangerates('THB').then(function (res) {
      $scope.rates = res;
      console.log($scope.rates);
    });
    $scope.submitadd = function () {
      alert('ok' + JSON.stringify($scope.data));
      console.log("doing sign up");
      AuthService.createexchange($scope.data);
    };

    ShopService.getProducts().then(function (products) {
      $scope.popular_products = products.slice(0, 2);
    });


      
  
  })


  .controller('ShoppingCartCtrl', function ($scope, ShopService, $ionicActionSheet, _) {
    $scope.products = ShopService.getCartProducts();

    $scope.removeProductFromCart = function (product) {
      $ionicActionSheet.show({
        destructiveText: 'Remove from cart',
        cancelText: 'Cancel',
        cancel: function () {
          return true;
        },
        destructiveButtonClicked: function () {
          ShopService.removeProductFromCart(product);
          $scope.products = ShopService.getCartProducts();
          return true;
        }
      });
    };

    $scope.getSubtotal = function () {
      return _.reduce($scope.products, function (memo, product) { return memo + product.price; }, 0);
    };

  })


  .controller('CheckoutCtrl', function ($scope) {
    //$scope.paymentDetails;
  })

  .controller('SettingsCtrl', function ($rootScope, $scope, $state, $ionicModal, AuthService) {

    $ionicModal.fromTemplateUrl('views/app/legal/terms-of-service.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.terms_of_service_modal = modal;
    });

    $ionicModal.fromTemplateUrl('views/app/legal/privacy-policy.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.privacy_policy_modal = modal;
    });

    $scope.showTerms = function () {
      $scope.terms_of_service_modal.show();
    };

    $scope.showPrivacyPolicy = function () {
      $scope.privacy_policy_modal.show();
    };

    $rootScope.$on('userLoggedOut', function (e) {

      $state.go('auth.welcome');
    });

    $scope.logOut = function () {
      AuthService.logOut();
    };

  })



  ;
